package com.intelliquiz.api.infrastructure.config;

import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.ports.TeamRepository;
import com.intelliquiz.api.infrastructure.websocket.GameState;
import com.intelliquiz.api.infrastructure.websocket.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Service for broadcasting WebSocket messages to quiz clients.
 * Handles game state, timer, question, and notification broadcasts.
 */
@Service
public class QuizBroadcastService {

    private static final Logger logger = LoggerFactory.getLogger(QuizBroadcastService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final QuizSessionManager sessionManager;
    private final TeamRepository teamRepository;

    public QuizBroadcastService(
            SimpMessagingTemplate messagingTemplate,
            QuizSessionManager sessionManager,
            TeamRepository teamRepository
    ) {
        this.messagingTemplate = messagingTemplate;
        this.sessionManager = sessionManager;
        this.teamRepository = teamRepository;
    }

    // ==================== Game State Broadcasts ====================

    /**
     * Broadcasts game state to all clients in a quiz.
     */
    public void broadcastGameState(Long quizId, GameStateMessage stateMessage) {
        sessionManager.setCurrentState(quizId, stateMessage.state());
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/state",
                stateMessage
        );
        logger.debug("Broadcast game state {} to quiz {}", stateMessage.state(), quizId);
    }

    // ==================== Buffer/Timer Broadcasts ====================

    /**
     * Broadcasts buffer countdown tick to all clients.
     */
    public void broadcastBufferTick(Long quizId, int remainingSeconds, String roundName) {
        BufferMessage message = BufferMessage.create(remainingSeconds, roundName);
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/timer",
                message
        );
    }

    /**
     * Broadcasts timer tick to all clients.
     */
    public void broadcastTimerTick(Long quizId, int remainingSeconds, int totalSeconds) {
        TimerMessage message = TimerMessage.active(remainingSeconds, totalSeconds);
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/timer",
                message
        );
    }

    /**
     * Broadcasts timer expired to all clients.
     */
    public void broadcastTimerExpired(Long quizId, int totalSeconds) {
        TimerMessage message = TimerMessage.expired(totalSeconds);
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/timer",
                message
        );
    }

    /**
     * Broadcasts timer paused to all clients.
     */
    public void broadcastTimerPaused(Long quizId, int remainingSeconds, int totalSeconds) {
        TimerMessage message = TimerMessage.paused(remainingSeconds, totalSeconds);
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/timer",
                message
        );
    }

    // ==================== Question Broadcasts ====================

    /**
     * Broadcasts question to all clients (JIT - no correctKey).
     */
    public void broadcastQuestion(Long quizId, QuestionPayload question) {
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/state",
                question
        );
        logger.debug("Broadcast question {} to quiz {}", question.questionId(), quizId);
    }

    /**
     * Broadcasts answer reveal to all clients.
     */
    public void broadcastAnswerReveal(Long quizId, AnswerRevealPayload reveal) {
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/state",
                reveal
        );
        logger.debug("Broadcast answer reveal for question {} to quiz {}", reveal.questionId(), quizId);
    }

    // ==================== Scoreboard Broadcasts ====================

    /**
     * Broadcasts scoreboard to all clients.
     */
    public void broadcastScoreboard(Long quizId, List<TeamResult> scores) {
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/state",
                scores
        );
        logger.debug("Broadcast scoreboard to quiz {} with {} teams", quizId, scores.size());
    }

    // ==================== Host Notifications ====================

    /**
     * Sends notification to host only.
     */
    public void sendToHost(Long quizId, HostNotification notification) {
        messagingTemplate.convertAndSend(
                "/topic/quiz/" + quizId + "/host",
                notification
        );
        logger.debug("Sent host notification {} to quiz {}", notification.type(), quizId);
    }

    /**
     * Notifies host that a team joined.
     */
    public void notifyTeamJoined(Long quizId, Long teamId) {
        teamRepository.findById(teamId).ifPresent(team -> {
            TeamInfo teamInfo = TeamInfo.connected(team, Instant.now());
            sendToHost(quizId, HostNotification.teamJoined(teamInfo));
            
            // Also broadcast updated team count
            int connectedCount = sessionManager.getConnectedTeamCount(quizId);
            sendToHost(quizId, new HostNotification("TEAM_COUNT", connectedCount));
        });
    }

    /**
     * Notifies host that a team disconnected.
     */
    public void notifyTeamDisconnected(Long quizId, Long teamId) {
        sendToHost(quizId, HostNotification.teamDisconnected(teamId));
        
        // Also broadcast updated team count
        int connectedCount = sessionManager.getConnectedTeamCount(quizId);
        sendToHost(quizId, new HostNotification("TEAM_COUNT", connectedCount));
    }

    /**
     * Notifies host that a team submitted an answer (without revealing the answer).
     */
    public void notifyTeamSubmitted(Long quizId, Long teamId) {
        sendToHost(quizId, HostNotification.teamSubmitted(teamId));
    }

    /**
     * Notifies host that all teams have submitted.
     */
    public void notifyAllSubmitted(Long quizId, int teamCount) {
        sendToHost(quizId, HostNotification.allSubmitted(teamCount));
    }

    /**
     * Notifies host that host disconnected (for logging/recovery).
     */
    public void notifyHostDisconnected(Long quizId) {
        // Broadcast pause state to all participants
        GameState currentState = sessionManager.getCurrentState(quizId);
        if (currentState == GameState.ACTIVE) {
            broadcastGameState(quizId, GameStateMessage.paused(quizId, "Host disconnected. Waiting for reconnection..."));
        }
        logger.warn("Host disconnected from quiz {}", quizId);
    }

    // ==================== Team-Specific Messages ====================

    /**
     * Sends message to a specific team.
     */
    public void sendToTeam(Long quizId, Long teamId, Object message) {
        messagingTemplate.convertAndSend(
                "/queue/team/" + teamId,
                message
        );
    }

    /**
     * Sends submission confirmation to a team.
     */
    public void sendSubmissionConfirmation(Long quizId, Long teamId, Long questionId) {
        sendToTeam(quizId, teamId, new SubmissionConfirmation(questionId, true, "Answer received"));
    }

    // ==================== Error Messages ====================

    /**
     * Sends error message to a specific session.
     */
    public void sendError(String sessionId, ErrorMessage error) {
        messagingTemplate.convertAndSendToUser(
                sessionId,
                "/queue/errors",
                error
        );
        logger.debug("Sent error {} to session {}", error.code(), sessionId);
    }

    /**
     * Submission confirmation record.
     */
    public record SubmissionConfirmation(Long questionId, boolean success, String message) {}
}
