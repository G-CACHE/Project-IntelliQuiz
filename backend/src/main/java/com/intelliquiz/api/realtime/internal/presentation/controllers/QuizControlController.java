package com.intelliquiz.api.realtime.internal.presentation.controllers;

import com.intelliquiz.api.realtime.internal.application.services.*;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.presentation.dto.HostCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * REST Controller for quiz host commands.
 * 
 * Replaces WebSocket /app/quiz/{id}/command endpoint with REST POST.
 * Processes host control commands like START_ROUND, NEXT_QUESTION, PAUSE, RESUME, END_QUIZ.
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizControlController {

    private final GameFlowService gameFlowService;
    private final QuizSessionManager quizSessionManager;
    private final QuizTimerService timerService;

    /**
     * Send a host control command to advance quiz state.
     * 
     * Request: POST /api/quiz/{quizId}/command
     * Body: { "type": "START_ROUND|NEXT_QUESTION|PAUSE|RESUME|END_QUIZ|...", "payload": {...} }
     * 
     * Response:
     * - 200 OK: { "status": "executed", "newGameState": "BUFFER|ACTIVE|REVEAL|...", "message": "..." }
     * - 400 BAD_REQUEST: { "status": "failed", "message": "Invalid state transition" }
     * - 401 UNAUTHORIZED: { "status": "failed", "message": "Not authorized as host" }
     * 
     * Side effects (vary by command type):
     * - START_ROUND: Starts buffer countdown, broadcasts state
     * - NEXT_QUESTION: Shows next question, starts timer
     * - PAUSE: Pauses timer and game
     * - RESUME: Resumes timer
     * - END_QUIZ: Ends quiz, cleanup
     * 
     * @param quizId Quiz identifier
     * @param command Host command with type and optional payload
     * @return Result response with new game state
     */
    @PostMapping("/{quizId}/command")
    public ResponseEntity<?> sendCommand(
            @PathVariable Long quizId,
            @RequestBody HostCommand command) {

        log.info("Host command: quiz={}, type={}", quizId, command.type());

        try {
            GameState newState = null;

            switch (command.type()) {
                case START_QUIZ:
                    gameFlowService.startQuiz(quizId);
                    newState = quizSessionManager.getCurrentState(quizId);
                    break;

                case START_ROUND:
                    // Backward compatibility for older clients. Delegates to mode-aware start.
                    gameFlowService.startQuiz(quizId);
                    newState = quizSessionManager.getCurrentState(quizId);
                    break;

                case NEXT_QUESTION:
                    gameFlowService.advanceToNextQuestion(quizId);
                    newState = quizSessionManager.getCurrentState(quizId);
                    break;

                case VIEW_LEADERBOARD:
                    gameFlowService.showRoundSummary(quizId);
                    newState = GameState.ROUND_SUMMARY;
                    break;

                case PAUSE:
                    gameFlowService.pauseGame(quizId);
                    newState = quizSessionManager.getCurrentState(quizId);
                    break;

                case RESUME:
                    gameFlowService.resumeGame(quizId);
                    newState = GameState.ACTIVE;
                    break;

                case END_QUIZ:
                    gameFlowService.endQuiz(quizId);
                    newState = GameState.ENDED;
                    break;

                default:
                    return ResponseEntity.badRequest().body(new CommandResponse(
                        "failed",
                        null,
                        "Unknown command type: " + command.type()
                    ));
            }

            log.info("Command executed: type={}, newState={}", command.type(), newState);

            return ResponseEntity.ok(new CommandResponse(
                "executed",
                newState != null ? newState.toString() : "UNKNOWN",
                "Command executed successfully"
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid command: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new CommandResponse(
                "failed",
                null,
                e.getMessage()
            ));
        } catch (IllegalStateException e) {
            log.warn("Invalid state transition: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new CommandResponse(
                "failed",
                null,
                "Invalid state transition: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error executing command: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new CommandResponse(
                "failed",
                null,
                "Server error executing command"
            ));
        }
    }

    /**
     * Get current game state (for polling or verification)
     * 
     * Request: GET /api/quiz/{quizId}/state
     * Response: { "state": "ACTIVE", "questionIndex": 2, "timeRemaining": 15, "timestamp": "..." }
     */
    @GetMapping("/{quizId}/state")
    public ResponseEntity<?> getCurrentState(@PathVariable Long quizId) {
        try {
            GameState state = quizSessionManager.getCurrentState(quizId);
            int questionIndex = quizSessionManager.getCurrentQuestionIndex(quizId);
            int timeRemaining = timerService.getRemainingSeconds(quizId);

            return ResponseEntity.ok(new StateResponse(
                state != null ? state.toString() : "UNKNOWN",
                questionIndex,
                (long) timeRemaining,
                LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("Error getting state: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Explicit quiz start endpoint for REST clients.
     * Uses quiz's configured navigation mode to route the start flow.
     */
    @PostMapping("/{quizId}/start")
    public ResponseEntity<?> startQuiz(@PathVariable Long quizId) {
        try {
            gameFlowService.startQuiz(quizId);
            GameState newState = quizSessionManager.getCurrentState(quizId);
            return ResponseEntity.ok(new CommandResponse(
                    "executed",
                    newState != null ? newState.toString() : "UNKNOWN",
                    "Quiz started successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new CommandResponse(
                    "failed",
                    null,
                    e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error starting quiz {}: {}", quizId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new CommandResponse(
                    "failed",
                    null,
                    "Server error starting quiz"
            ));
        }
    }

    /**
     * Participant-controlled question navigation endpoint.
     * Available only when participant navigation is enabled for the session.
     */
    @PostMapping("/{quizId}/navigate")
    public ResponseEntity<?> navigateToQuestion(
            @PathVariable Long quizId,
            @RequestParam Long teamId,
            @RequestBody NavigateRequest request) {
        try {
            if (request.questionIndex() == null) {
                return ResponseEntity.badRequest().body(new NavigateResponse(
                        "failed",
                        null,
                        "questionIndex is required"
                ));
            }

            var question = gameFlowService.navigateToQuestion(quizId, teamId, request.questionIndex());

            return ResponseEntity.ok(new NavigateResponse(
                    "executed",
                    question,
                    "Navigation successful"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new NavigateResponse(
                    "failed",
                    null,
                    e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error navigating question for quiz {} team {}: {}", quizId, teamId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NavigateResponse(
                    "failed",
                    null,
                    "Server error executing navigation"
            ));
        }
    }

    /**
     * Response object for command endpoint
     */
    public record CommandResponse(String status, String newGameState, String message) {}

    public record NavigateRequest(Integer questionIndex) {}

    public record NavigateResponse(String status, Object question, String message) {}

    /**
     * Response object for state query
     */
    public record StateResponse(String state, Integer questionIndex, Long timeRemaining, LocalDateTime timestamp) {}
}
