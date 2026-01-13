package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import com.intelliquiz.api.infrastructure.config.WebSocketAuthInterceptor.QuizPrincipal;
import com.intelliquiz.api.infrastructure.websocket.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller for quiz real-time communication.
 * Handles host commands and participant submissions.
 */
@Controller
public class QuizWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(QuizWebSocketController.class);

    private final GameFlowService gameFlowService;
    private final QuizSessionManager sessionManager;
    private final QuizBroadcastService broadcastService;

    public QuizWebSocketController(
            GameFlowService gameFlowService,
            QuizSessionManager sessionManager,
            QuizBroadcastService broadcastService
    ) {
        this.gameFlowService = gameFlowService;
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
    }

    /**
     * Handles host commands for controlling quiz flow.
     */
    @MessageMapping("/quiz/{quizId}/command")
    public void handleHostCommand(
            @DestinationVariable Long quizId,
            @Payload HostCommand command,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();
        
        // Validate host identity
        if (quizPrincipal == null || !quizPrincipal.isHost()) {
            broadcastService.sendError(sessionId, ErrorMessage.notHost());
            return;
        }
        
        // Validate quiz ID matches
        if (!quizPrincipal.quizId().equals(quizId)) {
            broadcastService.sendError(sessionId, ErrorMessage.invalidState("Quiz ID mismatch"));
            return;
        }
        
        logger.info("Host command {} for quiz {}", command.type(), quizId);
        
        try {
            switch (command.type()) {
                case START_ROUND -> {
                    String roundName = (String) command.payload().getOrDefault("round", "ROUND");
                    gameFlowService.startRound(quizId, roundName);
                }
                case NEXT_QUESTION -> gameFlowService.advanceToNextQuestion(quizId);
                case VIEW_LEADERBOARD -> gameFlowService.showRoundSummary(quizId);
                case START_TIEBREAKER -> gameFlowService.startTiebreaker(quizId);
                case END_QUIZ -> gameFlowService.endQuiz(quizId);
                case PAUSE -> gameFlowService.pauseGame(quizId);
                case RESUME -> gameFlowService.resumeGame(quizId);
            }
        } catch (Exception e) {
            logger.error("Error handling host command {} for quiz {}: {}", command.type(), quizId, e.getMessage());
            broadcastService.sendError(sessionId, new ErrorMessage("COMMAND_ERROR", e.getMessage()));
        }
    }

    /**
     * Handles answer submissions from participants.
     */
    @MessageMapping("/quiz/{quizId}/submit")
    public void handleSubmission(
            @DestinationVariable Long quizId,
            @Payload SubmissionMessage submission,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();
        
        // Validate participant identity
        if (quizPrincipal == null || quizPrincipal.isHost()) {
            broadcastService.sendError(sessionId, ErrorMessage.notParticipant());
            return;
        }
        
        // Validate quiz ID matches
        if (!quizPrincipal.quizId().equals(quizId)) {
            broadcastService.sendError(sessionId, ErrorMessage.invalidState("Quiz ID mismatch"));
            return;
        }
        
        Long teamId = quizPrincipal.teamId();
        
        logger.debug("Submission from team {} for question {} in quiz {}", teamId, submission.questionId(), quizId);
        
        try {
            gameFlowService.handleSubmission(quizId, teamId, submission.questionId(), submission.answer(), sessionId);
        } catch (Exception e) {
            logger.error("Error handling submission from team {} for quiz {}: {}", teamId, quizId, e.getMessage());
            broadcastService.sendError(sessionId, new ErrorMessage("SUBMISSION_ERROR", e.getMessage()));
        }
    }

    /**
     * Handles connection status requests.
     */
    @MessageMapping("/quiz/{quizId}/status")
    public void handleStatusRequest(
            @DestinationVariable Long quizId,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();
        
        if (quizPrincipal == null) {
            return;
        }
        
        // Send current game state to the requesting client
        GameState currentState = sessionManager.getCurrentState(quizId);
        int connectedTeams = sessionManager.getConnectedTeamCount(quizId);
        
        GameStateMessage stateMessage = new GameStateMessage(
                currentState,
                quizId,
                sessionManager.getCurrentQuestionIndex(quizId),
                null,
                null,
                "Connected teams: " + connectedTeams
        );
        
        if (quizPrincipal.isHost()) {
            broadcastService.sendToHost(quizId, new HostNotification("STATUS", stateMessage));
        } else {
            broadcastService.sendToTeam(quizId, quizPrincipal.teamId(), stateMessage);
        }
    }
}
