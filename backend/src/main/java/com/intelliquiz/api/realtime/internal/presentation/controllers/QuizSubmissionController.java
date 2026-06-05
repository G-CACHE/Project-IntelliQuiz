package com.intelliquiz.api.realtime.internal.presentation.controllers;

import com.intelliquiz.api.realtime.internal.application.services.*;
import com.intelliquiz.api.realtime.internal.presentation.dto.SubmissionMessage;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.team.TeamFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for quiz answer submissions.
 * 
 * Replaces WebSocket /app/quiz/{id}/submit endpoint with REST POST.
 * Validates submission and processes answer grading.
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizSubmissionController {

    private final QuizSessionManager quizSessionManager;
    private final QuizTimerService timerService;
    private final SubmissionFacade submissionFacade;
    private final QuizBroadcastService broadcastService;
    private final QuizFacade quizFacade;
    private final TeamFacade teamFacade;

    /**
     * Submit an answer for a quiz question.
     * 
     * Request: POST /api/quiz/{quizId}/answer
     * Body: { "teamId": "...", "questionId": "...", "answer": "...", "timestamp": "..." }
     * 
     * Response: 
     * - 200 OK: { "status": "accepted", "submissionId": "...", "message": "..." }
     * - 400 BAD_REQUEST: { "status": "rejected", "message": "Timer expired" }
     * - 403 FORBIDDEN: { "status": "rejected", "message": "Unauthorized" }
     * 
     * Side effects:
     * - Persists submission to database
     * - Broadcasts SUBMISSION_NOTIFY event to host
     * - Returns error if timer already expired
     * 
     * @param quizId Quiz identifier
     * @param submission Answer submission payload
     * @return Result response with status and submission ID
     */
    @PostMapping("/{quizId}/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long quizId,
            @RequestParam Long teamId,
            @RequestBody SubmissionMessage submission) {

        log.info("Answer submission: quiz={}, team={}, question={}", quizId, teamId, submission.questionId());

        try {
            // Validate: Quiz exists and is active
            GameState currentState = quizSessionManager.getCurrentState(quizId);
            log.debug("Current game state for quiz {}: {}", quizId, currentState);
            
            // Check if quiz has ended
            if (currentState == GameState.ENDED) {
                return ResponseEntity.badRequest().body(new SubmissionResponse(
                    "rejected",
                    null,
                    "Quiz has ended. No more submissions allowed"
                ));
            }
            
            // Check if question is active (allow ACTIVE state only)
            if (currentState != GameState.ACTIVE) {
                String errorMsg = "Quiz is not ready for submissions. Current state: " + currentState;
                if (currentState == GameState.LOBBY) {
                    errorMsg = "Quiz has not started yet. Please wait for the first question";
                } else if (currentState == GameState.BUFFER) {
                    errorMsg = "Please wait... The first question is about to start";
                } else if (currentState == GameState.GRADING || currentState == GameState.REVEAL) {
                    errorMsg = "Submissions are closed. The answer is being revealed";
                } else if (currentState == GameState.ROUND_SUMMARY) {
                    errorMsg = "Round summary is being displayed. Wait for the next question";
                }
                log.warn("Submission rejected for quiz {} due to state: {}", quizId, currentState);
                return ResponseEntity.badRequest().body(new SubmissionResponse(
                    "rejected",
                    null,
                    errorMsg
                ));
            }

            // Validate: Timer is still running
            if (!timerService.isTimerActive(quizId)) {
                log.warn("Submission rejected for quiz {} - timer has expired", quizId);
                return ResponseEntity.badRequest().body(new SubmissionResponse(
                    "rejected",
                    null,
                    "Time's up! Submissions are no longer accepted"
                ));
            }

            // Submit answer via facade (persists to database)
            var submissionInfo = submissionFacade.submitAnswer(
                teamId,
                submission.questionId(),
                submission.answer()
            );

            // Notify host of submission
            broadcastService.notifyTeamSubmitted(quizId, teamId);

            log.info("Answer accepted: submission={}", submissionInfo.id());
            
            return ResponseEntity.ok(new SubmissionResponse(
                "accepted",
                String.valueOf(submissionInfo.id()),
                "Answer recorded successfully"
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid submission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new SubmissionResponse(
                "rejected", 
                null, 
                e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error processing submission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new SubmissionResponse(
                "rejected",
                null,
                "Server error processing submission"
            ));
        }
    }

    /**
     * Returns a participant's per-question quiz results in quiz order.
     *
     * Request: GET /api/quiz/{quizId}/participant-results?teamId=123
     */
    @GetMapping("/{quizId}/participant-results")
    public ResponseEntity<?> getParticipantResults(
            @PathVariable Long quizId,
            @RequestParam Long teamId) {
        try {
            if (!quizFacade.quizExists(quizId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ParticipantResultsErrorResponse("Quiz not found"));
            }

            var teamInfo = teamFacade.getTeamInfo(teamId).orElse(null);
            if (teamInfo == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ParticipantResultsErrorResponse("Team not found"));
            }
            if (!quizId.equals(teamInfo.quizId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ParticipantResultsErrorResponse("Team does not belong to this quiz"));
            }

            var orderedQuestions = quizFacade.getOrderedQuestions(quizId);
            List<ParticipantQuestionResult> results = orderedQuestions.stream()
                    .map(question -> {
                        var submission = submissionFacade.findByTeamAndQuestion(teamId, question.id());
                        // Resolve raw stored answer (e.g. letter "A") to display text (e.g. "Paris")
                        // so the review modal shows the same format as the correct answer.
                        String rawAnswer = submission.map(s -> s.submittedAnswer()).orElse(null);
                        String participantAnswer = question.resolvedParticipantAnswer(rawAnswer);
                        boolean isCorrect = submission.map(s -> s.isCorrect()).orElse(false);
                        int pointsEarned = submission.map(s -> s.awardedPoints()).orElse(0);

                        return new ParticipantQuestionResult(
                                question.id(),
                                question.orderIndex() + 1,
                                question.text(),
                                participantAnswer,
                                question.resolvedCorrectAnswer(),
                                isCorrect,
                                pointsEarned,
                                question.points()
                        );
                    })
                    .toList();

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error getting participant results for quiz {} team {}: {}", quizId, teamId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ParticipantResultsErrorResponse("Server error retrieving participant results"));
        }
    }

    /**
     * Response object for submission endpoint
     */
    public record SubmissionResponse(String status, String submissionId, String message) {}

    public record ParticipantQuestionResult(
            Long questionId,
            int questionNumber,
            String questionText,
            String participantAnswer,
            String correctAnswer,
            boolean isCorrect,
            int pointsEarned,
            int maxPoints
    ) {}

    public record ParticipantResultsErrorResponse(String message) {}
}
