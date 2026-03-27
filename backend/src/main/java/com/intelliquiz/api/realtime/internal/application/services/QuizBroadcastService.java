package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.infrastructure.config.SSEConnectionRegistry;
import com.intelliquiz.api.realtime.internal.presentation.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Service for broadcasting messages to quiz clients via Server-Sent Events (SSE).
 * Migrated from WebSocket/STOMP to SSE for simplified real-time communication.
 * Handles game state, timer, question, and notification broadcasts.
 * Uses module facades instead of direct repository access.
 */
@Service
public class QuizBroadcastService {

    private static final Logger logger = LoggerFactory.getLogger(QuizBroadcastService.class);

    private final SSEConnectionRegistry sseRegistry;
    private final QuizSessionManager sessionManager;
    private final TeamFacade teamFacade;

    public QuizBroadcastService(
            SSEConnectionRegistry sseRegistry,
            QuizSessionManager sessionManager,
            TeamFacade teamFacade
    ) {
        this.sseRegistry = sseRegistry;
        this.sessionManager = sessionManager;
        this.teamFacade = teamFacade;
    }

    /**
     * Broadcasts game state to all clients in a quiz via SSE.
     */
    public void broadcastGameState(Long quizId, GameStateMessage stateMessage) {
        sessionManager.setCurrentState(quizId, stateMessage.state());
        
        // Broadcast via SSE
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, stateMessage);
        sseRegistry.broadcast(quizIdStr, event);
        logger.debug("Broadcast game state {} to quiz {}", stateMessage.state(), quizId);
    }

    /**
     * Sends a game state snapshot to all clients WITHOUT modifying session state via SSE.
     * Used by status request handlers to avoid race conditions with timer callbacks.
     */
    public void sendGameStateSnapshot(Long quizId, GameStateMessage stateMessage) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, stateMessage);
        sseRegistry.broadcast(quizIdStr, event);
        
        logger.debug("Sent game state snapshot {} to quiz {}", stateMessage.state(), quizId);
    }

    // ==================== Buffer/Timer Broadcasts ====================

    /**
     * Broadcasts buffer countdown tick to all clients via SSE.
     */
    public void broadcastBufferTick(Long quizId, int remainingSeconds, String roundName) {
        BufferMessage message = BufferMessage.create(remainingSeconds, roundName);
        
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.TIMER_TICK, message);
        sseRegistry.broadcast(quizIdStr, event);
        
    }

    /**
     * Broadcasts timer tick to all clients via SSE.
     */
    public void broadcastTimerTick(Long quizId, int remainingSeconds, int totalSeconds) {
        TimerMessage message = TimerMessage.active(remainingSeconds, totalSeconds);
        
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.TIMER_TICK, message);
        sseRegistry.broadcast(quizIdStr, event);
        
    }

    /**
     * Broadcasts timer expired to all clients via SSE.
     */
    public void broadcastTimerExpired(Long quizId, int totalSeconds) {
        TimerMessage message = TimerMessage.expired(totalSeconds);
        
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.TIMER_TICK, message);
        sseRegistry.broadcast(quizIdStr, event);
        
    }

    /**
     * Broadcasts timer paused to all clients via SSE.
     */
    public void broadcastTimerPaused(Long quizId, int remainingSeconds, int totalSeconds) {
        TimerMessage message = TimerMessage.paused(remainingSeconds, totalSeconds);
        
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.TIMER_TICK, message);
        sseRegistry.broadcast(quizIdStr, event);
        
    }

    // ==================== Question Broadcasts ====================

    /**
     * Broadcasts question to all clients via SSE (JIT - no correctKey).
     */
    public void broadcastQuestion(Long quizId, QuestionPayload question) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, question);
        sseRegistry.broadcast(quizIdStr, event);
        
        logger.debug("Broadcast question {} to quiz {}", question.questionId(), quizId);
    }

    /**
     * Broadcasts answer reveal to all clients via SSE.
     */
    public void broadcastAnswerReveal(Long quizId, AnswerRevealPayload reveal) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.ANSWER_REVEAL, reveal);
        sseRegistry.broadcast(quizIdStr, event);
        
        logger.debug("Broadcast answer reveal for question {} to quiz {}", reveal.questionId(), quizId);
    }

    // ==================== Scoreboard Broadcasts ====================

    /**
     * Broadcasts scoreboard to all clients via SSE.
     */
    public void broadcastScoreboard(Long quizId, List<TeamResult> scores) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, scores);
        sseRegistry.broadcast(quizIdStr, event);
        
        logger.debug("Broadcast scoreboard to quiz {} with {} teams", quizId, scores.size());
    }

    // ==================== Host Notifications ====================

    /**
     * Sends notification to host only via SSE.
     */
    public void sendToHost(Long quizId, HostNotification notification) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.SUBMISSION_NOTIFY, notification);
        sseRegistry.broadcastToHost(quizIdStr, event);
        
        logger.debug("Sent host notification {} to quiz {}", notification.type(), quizId);
    }

    /**
     * Notifies host that a team joined via SSE.
     */
    public void notifyTeamJoined(Long quizId, Long teamId) {
        teamFacade.getTeamInfo(teamId).ifPresent(team -> {
            TeamInfo teamInfo = TeamInfo.connected(team.id(), team.name(), Instant.now());
            sendToHost(quizId, HostNotification.teamJoined(teamInfo));
            
            // Broadcast team connection to all clients via SSE
            String quizIdStr = String.valueOf(quizId);
            TeamConnectionMessage connectionMessage = new TeamConnectionMessage(
                    "TEAM_CONNECTED",
                    teamId,
                    team.name(),
                    Instant.now().toString()
            );
            SSEEvent event = SSEEvent.create(SSEEvent.EventType.TEAM_JOINED, connectionMessage);
            sseRegistry.broadcast(quizIdStr, event);
            
            // Also broadcast updated team count
            int connectedCount = sessionManager.getConnectedTeamCount(quizId);
            sendToHost(quizId, new HostNotification("TEAM_COUNT", connectedCount));
        });
    }

    /**
     * Notifies host that a team disconnected via SSE.
     */
    public void notifyTeamDisconnected(Long quizId, Long teamId) {
        sendToHost(quizId, HostNotification.teamDisconnected(teamId));
        
        // Broadcast team disconnection to all clients via SSE
        String quizIdStr = String.valueOf(quizId);
        TeamConnectionMessage connectionMessage = new TeamConnectionMessage(
                "TEAM_DISCONNECTED",
                teamId,
                null,
                Instant.now().toString()
        );
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.TEAM_DISCONNECTED, connectionMessage);
        sseRegistry.broadcast(quizIdStr, event);
        
        
        // Also broadcast updated team count
        int connectedCount = sessionManager.getConnectedTeamCount(quizId);
        sendToHost(quizId, new HostNotification("TEAM_COUNT", connectedCount));
    }

    /**
     * Notifies host that a team submitted an answer (without revealing the answer) via SSE.
     */
    public void notifyTeamSubmitted(Long quizId, Long teamId) {
        HostNotification submissionNotice = HostNotification.teamSubmitted(teamId);
        sendToHost(quizId, submissionNotice);

        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.SUBMISSION_NOTIFY, submissionNotice);
        sseRegistry.broadcastToProctors(quizIdStr, event);
    }

    /**
     * Notifies host that all teams have submitted via SSE.
     */
    public void notifyAllSubmitted(Long quizId, int teamCount) {
        sendToHost(quizId, HostNotification.allSubmitted(teamCount));
    }

    /**
     * Notifies host that host disconnected (for logging/recovery) via SSE.
     */
    public void notifyHostDisconnected(Long quizId) {
        // Broadcast pause state to all participants via SSE
        GameState currentState = sessionManager.getCurrentState(quizId);
        if (currentState == GameState.ACTIVE) {
            broadcastGameState(quizId, GameStateMessage.paused(quizId, "Host disconnected. Waiting for reconnection..."));
        }
        logger.warn("Host disconnected from quiz {}", quizId);
    }

    // ==================== Team-Specific Messages ====================

    /**
     * Sends message to a specific team via SSE.
     */
    public void sendToTeam(Long quizId, Long teamId, Object message) {
        String quizIdStr = String.valueOf(quizId);
        String teamIdStr = String.valueOf(teamId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, message);
        sseRegistry.broadcastToTeam(quizIdStr, teamIdStr, event);
        
    }

    /**
     * Sends submission confirmation to a team via SSE.
     */
    public void sendSubmissionConfirmation(Long quizId, Long teamId, Long questionId) {
        sendToTeam(quizId, teamId, new SubmissionConfirmation(questionId, true, "Answer received"));
    }

    // ==================== Error Messages ====================

    /**
     * Sends error message to a specific session via SSE.
     */
    public void sendError(String sessionId, ErrorMessage error) {
        // Note: SSE doesn't support per-session routing like STOMP does
        // This is handled by the SSE controller with sessionId tracking
        
        logger.debug("Sent error {} to session {}", error.code(), sessionId);
    }

    /**
     * Submission confirmation record.
     */
    public record SubmissionConfirmation(Long questionId, boolean success, String message) {}

    // ==================== Proctoring Broadcasts ====================

    /**
     * Broadcasts a message to all proctor sessions watching a quiz via SSE.
     */
    public void broadcastToProctors(Long quizId, Object message) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.VIOLATION_NOTIFY, message);
        sseRegistry.broadcastToProctors(quizIdStr, event);
        
        logger.debug("Broadcast proctoring message to quiz {}", quizId);
    }

    /**
     * Broadcasts a kick event to all participants and proctors via SSE.
     */
    public void broadcastKick(Long quizId, Object kickMessage) {
        String quizIdStr = String.valueOf(quizId);
        SSEEvent event = SSEEvent.create(SSEEvent.EventType.KICK_NOTIFICATION, kickMessage);
        sseRegistry.broadcast(quizIdStr, event);
        
        logger.debug("Broadcast kick event to quiz {}", quizId);
    }
}
