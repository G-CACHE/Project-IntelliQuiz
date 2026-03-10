package com.intelliquiz.api.realtime.internal.presentation.controllers;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.realtime.internal.application.services.GameFlowService;
import com.intelliquiz.api.realtime.internal.application.services.ProctorSessionService;
import com.intelliquiz.api.realtime.internal.application.services.QuizBroadcastService;
import com.intelliquiz.api.realtime.internal.application.services.QuizSessionManager;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.domain.enums.HostCommandType;
import com.intelliquiz.api.realtime.internal.infrastructure.config.WebSocketAuthInterceptor.QuizPrincipal;
import com.intelliquiz.api.realtime.internal.presentation.dto.*;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

/**
 * WebSocket controller for quiz real-time communication.
 * Handles host commands, participant submissions, proctoring violations, and navigation.
 */
@Controller
public class QuizWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(QuizWebSocketController.class);

    private final GameFlowService gameFlowService;
    private final QuizSessionManager sessionManager;
    private final QuizBroadcastService broadcastService;
    private final ProctorSessionService proctorSessionService;
    private final TeamFacade teamFacade;
    private final QuizFacade quizFacade;

    public QuizWebSocketController(
            GameFlowService gameFlowService,
            QuizSessionManager sessionManager,
            QuizBroadcastService broadcastService,
            ProctorSessionService proctorSessionService,
            TeamFacade teamFacade,
            QuizFacade quizFacade
    ) {
        this.gameFlowService = gameFlowService;
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
        this.proctorSessionService = proctorSessionService;
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
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
     * Returns full game snapshot including current question data.
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
        
        // Build full game state snapshot
        GameState currentState = sessionManager.getCurrentState(quizId);
        int questionIndex = sessionManager.getCurrentQuestionIndex(quizId);
        
        // Resolve current question if game is active
        QuestionPayload currentQuestionPayload = null;
        int totalQuestions = 0;
        String currentRound = null;
        
        try {
            List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
            totalQuestions = questions.size();
            
            if ((currentState == GameState.ACTIVE || currentState == GameState.REVEAL || currentState == GameState.PAUSED)
                    && questionIndex >= 0 && questionIndex < questions.size()) {
                QuestionInfoDto question = questions.get(questionIndex);
                currentQuestionPayload = QuestionPayload.fromDto(question);
                currentRound = question.difficulty();
            }
        } catch (Exception e) {
            logger.warn("Could not load questions for quiz {} status: {}", quizId, e.getMessage());
        }
        
        GameStateMessage stateMessage = new GameStateMessage(
                currentState,
                quizId,
                questionIndex,
                totalQuestions,
                currentRound,
                "Connected teams: " + sessionManager.getConnectedTeamCount(quizId),
                currentQuestionPayload
        );
        
        // Send snapshot to clients WITHOUT modifying session state (avoids race condition with timer callbacks)
        broadcastService.sendGameStateSnapshot(quizId, stateMessage);
    }

    // ==================== Proctoring Endpoints ====================

    /**
     * Handles violation reports from participants.
     * Increments violation counter and broadcasts to proctor.
     */
    @MessageMapping("/quiz/{quizId}/violation")
    public void handleViolation(
            @DestinationVariable Long quizId,
            @Payload ViolationReportMessage violation,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        if (quizPrincipal == null || quizPrincipal.isHost()) return;

        Long teamId = quizPrincipal.teamId();
        logger.info("Violation {} from team {} in quiz {}", violation.type(), teamId, quizId);

        boolean autoKicked = proctorSessionService.reportViolation(quizId, teamId, violation.type());
        int count = proctorSessionService.getViolationCount(quizId, teamId);

        // Get team name for notification
        String teamName = teamFacade.getTeamInfo(teamId)
                .map(TeamInfoDto::name)
                .orElse("Unknown");

        // Broadcast violation to proctor channel
        ViolationNotification notification = ViolationNotification.create(
                teamId, teamName, count, violation.type(), autoKicked
        );
        broadcastService.broadcastToProctors(quizId, notification);

        // If auto-kicked, also broadcast kick message to participant
        if (autoKicked) {
            KickMessage kickMsg = KickMessage.autoKick(teamId, teamName, count);
            broadcastService.sendToTeam(quizId, teamId, kickMsg);
            broadcastService.broadcastKick(quizId, kickMsg);
        }
    }

    /**
     * Handles manual kick command from proctor or host.
     */
    @MessageMapping("/quiz/{quizId}/kick")
    public void handleKick(
            @DestinationVariable Long quizId,
            @Payload KickMessage kickRequest,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();

        // Only host or proctor can kick
        if (quizPrincipal == null || (!quizPrincipal.isHost() && !sessionManager.isProctorSession(quizId, sessionId))) {
            broadcastService.sendError(sessionId, new ErrorMessage("UNAUTHORIZED", "Only host or proctor can kick participants."));
            return;
        }

        Long targetTeamId = kickRequest.teamId();
        proctorSessionService.kickParticipant(quizId, targetTeamId);

        String teamName = teamFacade.getTeamInfo(targetTeamId)
                .map(TeamInfoDto::name)
                .orElse("Unknown");

        KickMessage kickMsg = KickMessage.manualKick(targetTeamId, teamName);
        broadcastService.sendToTeam(quizId, targetTeamId, kickMsg);
        broadcastService.broadcastKick(quizId, kickMsg);
        broadcastService.broadcastToProctors(quizId, kickMsg);

        logger.info("Team {} manually kicked from quiz {} by {}", targetTeamId, quizId, quizPrincipal.getName());
    }

    /**
     * Handles auto-kick threshold setting from proctor or host.
     */
    @MessageMapping("/quiz/{quizId}/set-threshold")
    public void handleSetThreshold(
            @DestinationVariable Long quizId,
            @Payload ThresholdMessage threshold,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();

        if (quizPrincipal == null || (!quizPrincipal.isHost() && !sessionManager.isProctorSession(quizId, sessionId))) {
            broadcastService.sendError(sessionId, new ErrorMessage("UNAUTHORIZED", "Only host or proctor can set threshold."));
            return;
        }

        proctorSessionService.setAutoKickThreshold(quizId, threshold.threshold());
        logger.info("Auto-kick threshold set to {} for quiz {} by {}", threshold.threshold(), quizId, quizPrincipal.getName());
    }

    /**
     * Handles question navigation from participant (NON_LINEAR mode only).
     */
    @MessageMapping("/quiz/{quizId}/navigate")
    public void handleNavigate(
            @DestinationVariable Long quizId,
            @Payload NavigateMessage navigate,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        QuizPrincipal quizPrincipal = (QuizPrincipal) principal;
        String sessionId = headerAccessor.getSessionId();

        if (quizPrincipal == null || quizPrincipal.isHost()) {
            broadcastService.sendError(sessionId, new ErrorMessage("NAV_ERROR", "Only participants can navigate."));
            return;
        }

        Long teamId = quizPrincipal.teamId();
        QuestionPayload question = gameFlowService.navigateToQuestion(quizId, teamId, navigate.questionIndex(), sessionId);

        if (question != null) {
            broadcastService.sendToTeam(quizId, teamId, question);
        }
    }
}
