package com.intelliquiz.api.infrastructure.config;

import com.intelliquiz.api.infrastructure.config.WebSocketAuthInterceptor.QuizPrincipal;
import com.intelliquiz.api.infrastructure.websocket.GameState;
import com.intelliquiz.api.infrastructure.websocket.QuizTimerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket event listener for connection and disconnection events.
 * Broadcasts team join/disconnect events to the host.
 */
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final QuizSessionManager sessionManager;
    private final QuizBroadcastService broadcastService;
    private final QuizTimerService timerService;

    public WebSocketEventListener(
            QuizSessionManager sessionManager, 
            QuizBroadcastService broadcastService,
            QuizTimerService timerService
    ) {
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
        this.timerService = timerService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        QuizPrincipal principal = (QuizPrincipal) accessor.getUser();
        String sessionId = accessor.getSessionId();

        if (principal == null || sessionId == null) {
            logger.warn("Connection without principal or session ID");
            return;
        }

        if (principal.isHost()) {
            sessionManager.registerHost(principal.quizId(), sessionId);
            logger.info("Host connected to quiz {}: session {}", principal.quizId(), sessionId);
        } else {
            sessionManager.registerParticipant(principal.quizId(), principal.teamId(), sessionId);
            logger.info("Team {} connected to quiz {}: session {}", 
                    principal.teamId(), principal.quizId(), sessionId);
            
            // Notify host of team connection
            broadcastService.notifyTeamJoined(principal.quizId(), principal.teamId());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        if (sessionId == null) {
            return;
        }

        var connection = sessionManager.getConnection(sessionId);
        if (connection.isEmpty()) {
            return;
        }

        var conn = connection.get();
        sessionManager.unregister(sessionId);

        if (conn.isHost()) {
            logger.info("Host disconnected from quiz {}: session {}", conn.quizId(), sessionId);
            // Pause timer if host disconnects during active game
            GameState currentState = sessionManager.getCurrentState(conn.quizId());
            if (currentState == GameState.ACTIVE) {
                timerService.pauseTimer(conn.quizId());
            }
            broadcastService.notifyHostDisconnected(conn.quizId());
        } else {
            logger.info("Team {} disconnected from quiz {}: session {}", 
                    conn.teamId(), conn.quizId(), sessionId);
            // Notify host of team disconnection
            broadcastService.notifyTeamDisconnected(conn.quizId(), conn.teamId());
        }
    }
}
