package com.intelliquiz.api.realtime.internal.infrastructure.config;

import com.intelliquiz.api.realtime.internal.presentation.dto.SSEEvent;
import com.intelliquiz.api.realtime.internal.presentation.dto.TeamConnectionMessage;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Thread-safe registry for managing active SSE (Server-Sent Events) connections.
 * 
 * Maintains per-quiz and per-team mappings of SseEmitter objects, allowing
 * server to broadcast events to connected clients.
 * 
 * Structure:
 * - quizEmitters: Map<quizId, Map<sessionId, SseEmitter>>
 * - teamSessions: Map<quizId, Map<teamId, List<sessionId>>>
 * - sessionInfo: Map<sessionId, SessionMetadata>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SSEConnectionRegistry {

    private static final int HEARTBEAT_INTERVAL_SECONDS = 10;

    // quizId -> sessionId -> SseEmitter
    private final Map<String, Map<String, SseEmitter>> quizEmitters = new ConcurrentHashMap<>();

    // quizId -> teamId -> List<sessionIds>
    private final Map<String, Map<String, List<String>>> teamSessions = new ConcurrentHashMap<>();

    // sessionId -> SessionMetadata
    private final Map<String, SessionMetadata> sessionInfo = new ConcurrentHashMap<>();

    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();

    /**
     * Session metadata for tracking client details
     */
    public static class SessionMetadata {
        public String sessionId;
        public String quizId;
        public String role; // PARTICIPANT, HOST, PROCTOR
        public String teamId; // null for HOST/PROCTOR
        public String deviceId; // Browser-based UUID for device identification
        public long connectedAt;
        public long lastActivityAt;

        public SessionMetadata(String sessionId, String quizId, String role, String teamId, String deviceId) {
            this.sessionId = sessionId;
            this.quizId = quizId;
            this.role = role;
            this.teamId = teamId;
            this.deviceId = deviceId;
            this.connectedAt = System.currentTimeMillis();
            this.lastActivityAt = System.currentTimeMillis();
        }
    }

    @PostConstruct
    void startHeartbeat() {
        heartbeatScheduler.scheduleAtFixedRate(
            this::sendKeepAlive,
            HEARTBEAT_INTERVAL_SECONDS,
            HEARTBEAT_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
    }

    @PreDestroy
    void shutdownHeartbeat() {
        heartbeatScheduler.shutdownNow();
    }

    /**
     * Registers a new SSE connection for a quiz
     * 
     * @param quizId     Quiz identifier
     * @param sessionId  Unique session identifier
     * @param role       Client role (PARTICIPANT, HOST, PROCTOR)
     * @param teamId     Team identifier (null for HOST/PROCTOR)
     * @param deviceId   Browser-based UUID for device identification
     * @param emitter    Spring SseEmitter for sending events
     */
    public void register(String quizId, String sessionId, String role, String teamId, String deviceId, SseEmitter emitter) {
        log.debug("Registering SSE connection: quiz={}, session={}, role={}, team={}, device={}", 
            quizId, sessionId, role, teamId, deviceId);

        // Add emitter to quiz map
        quizEmitters.computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
            .put(sessionId, emitter);

        // Track team-session mapping for targeted broadcasts
        if (teamId != null && !"".equals(teamId)) {
            teamSessions.computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(teamId, k -> new CopyOnWriteArrayList<>())
                .add(sessionId);
        }

        // Store session metadata with device ID
        sessionInfo.put(sessionId, new SessionMetadata(sessionId, quizId, role, teamId, deviceId));

        // Set timeout handlers
        emitter.onTimeout(() -> handleEmitterTimeout(quizId, sessionId));
        emitter.onCompletion(() -> handleEmitterCompletion(quizId, sessionId));
    }

    /**
     * Unregisters (removes) an SSE connection
     * 
     * @param quizId    Quiz identifier
     * @param sessionId Session identifier to unregister
     */
    public void unregister(String quizId, String sessionId) {
        log.debug("Unregistering SSE connection: quiz={}, session={}", quizId, sessionId);

        SessionMetadata metadata = sessionInfo.get(sessionId);
        boolean shouldNotifyTeamDisconnected = false;
        String disconnectedTeamId = null;

        // Remove emitter
        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap != null) {
            emitterMap.remove(sessionId);
            if (emitterMap.isEmpty()) {
                quizEmitters.remove(quizId);
            }
        }

        // Remove team-session mapping
        if (metadata != null && metadata.teamId != null) {
            Map<String, List<String>> teamMap = teamSessions.get(quizId);
            if (teamMap != null) {
                List<String> sessions = teamMap.get(metadata.teamId);
                if (sessions != null) {
                    sessions.remove(sessionId);
                    if (sessions.isEmpty()) {
                        if ("PARTICIPANT".equalsIgnoreCase(metadata.role)) {
                            shouldNotifyTeamDisconnected = true;
                            disconnectedTeamId = metadata.teamId;
                        }
                        teamMap.remove(metadata.teamId);
                    }
                }
                if (teamMap.isEmpty()) {
                    teamSessions.remove(quizId);
                }
            }
        }

        // Remove session metadata
        sessionInfo.remove(sessionId);

        if (shouldNotifyTeamDisconnected && disconnectedTeamId != null) {
            broadcastTeamDisconnected(quizId, disconnectedTeamId);
        }
    }

    /**
     * Broadcasts an SSE event to all connected clients in a quiz
     * 
     * @param quizId Quiz identifier
     * @param event  SSEEvent to broadcast
     */
    public void broadcast(String quizId, SSEEvent event) {
        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap == null || emitterMap.isEmpty()) {
            log.debug("No emitters registered for quiz {}", quizId);
            return;
        }

        List<String> failedSessions = new ArrayList<>();
        for (Map.Entry<String, SseEmitter> entry : emitterMap.entrySet()) {
            try {
                sendEvent(entry.getValue(), event, entry.getKey());
            } catch (IOException e) {
                log.warn("Failed to send event to session {}: {}", entry.getKey(), e.getMessage());
                failedSessions.add(entry.getKey());
            }
        }

        // Clean up failed connections
        for (String sessionId : failedSessions) {
            unregister(quizId, sessionId);
        }
    }

    /**
     * Broadcasts an SSE event only to the host of a quiz
     * 
     * @param quizId Quiz identifier
     * @param event  SSEEvent to broadcast
     */
    public void broadcastToHost(String quizId, SSEEvent event) {
        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap == null) {
            return;
        }

        List<String> failedSessions = new ArrayList<>();
        for (Map.Entry<String, SseEmitter> entry : emitterMap.entrySet()) {
            SessionMetadata metadata = sessionInfo.get(entry.getKey());
            if (metadata != null && "HOST".equals(metadata.role)) {
                try {
                    sendEvent(entry.getValue(), event, entry.getKey());
                } catch (IOException e) {
                    log.warn("Failed to send event to host session {}: {}", entry.getKey(), e.getMessage());
                    failedSessions.add(entry.getKey());
                }
            }
        }

        // Clean up failed connections
        for (String sessionId : failedSessions) {
            unregister(quizId, sessionId);
        }
    }

    /**
     * Broadcasts an SSE event to proctors only
     * 
     * @param quizId Quiz identifier
     * @param event  SSEEvent to broadcast
     */
    public void broadcastToProctors(String quizId, SSEEvent event) {
        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap == null) {
            return;
        }

        List<String> failedSessions = new ArrayList<>();
        for (Map.Entry<String, SseEmitter> entry : emitterMap.entrySet()) {
            SessionMetadata metadata = sessionInfo.get(entry.getKey());
            if (metadata != null && "PROCTOR".equals(metadata.role)) {
                try {
                    sendEvent(entry.getValue(), event, entry.getKey());
                } catch (IOException e) {
                    log.warn("Failed to send event to proctor session {}: {}", entry.getKey(), e.getMessage());
                    failedSessions.add(entry.getKey());
                }
            }
        }

        // Clean up failed connections
        for (String sessionId : failedSessions) {
            unregister(quizId, sessionId);
        }
    }

    /**
     * Broadcasts an SSE event to a specific team
     * 
     * @param quizId Quiz identifier
     * @param teamId Team identifier
     * @param event  SSEEvent to broadcast
     */
    public void broadcastToTeam(String quizId, String teamId, SSEEvent event) {
        Map<String, List<String>> teamMap = teamSessions.get(quizId);
        if (teamMap == null) {
            return;
        }

        List<String> sessionIds = teamMap.get(teamId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return;
        }

        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap == null) {
            return;
        }

        List<String> failedSessions = new ArrayList<>();
        for (String sessionId : sessionIds) {
            SseEmitter emitter = emitterMap.get(sessionId);
            if (emitter != null) {
                try {
                    sendEvent(emitter, event, sessionId);
                } catch (IOException e) {
                    log.warn("Failed to send event to team session {}: {}", sessionId, e.getMessage());
                    failedSessions.add(sessionId);
                }
            }
        }

        // Clean up failed connections
        for (String sessionId : failedSessions) {
            unregister(quizId, sessionId);
        }
    }

    /**
     * Gets all connected sessions for a quiz
     * 
     * @param quizId Quiz identifier
     * @return Count of connected sessions
     */
    public int getQuizConnectionCount(String quizId) {
        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        return emitterMap != null ? emitterMap.size() : 0;
    }

    /**
     * Gets all connected teams for a quiz
     * 
     * @param quizId Quiz identifier
     * @return Set of connected team IDs
     */
    public Set<String> getConnectedTeams(String quizId) {
        Map<String, List<String>> teamMap = teamSessions.get(quizId);
        return teamMap != null ? new HashSet<>(teamMap.keySet()) : new HashSet<>();
    }

    /**
     * Cleans up all connections for a quiz (called on quiz end)
     * 
     * @param quizId Quiz identifier
     */
    public void cleanup(String quizId) {
        log.info("Cleaning up SSE connections for quiz {}", quizId);

        Map<String, SseEmitter> emitterMap = quizEmitters.get(quizId);
        if (emitterMap != null) {
            List<String> sessionIds = new ArrayList<>(emitterMap.keySet());
            for (String sessionId : sessionIds) {
                SseEmitter emitter = emitterMap.get(sessionId);
                if (emitter != null) {
                    emitter.complete();
                }
                unregister(quizId, sessionId);
            }
        }

        // Clean up cached data
        teamSessions.remove(quizId);
    }

    private void sendKeepAlive() {
        if (quizEmitters.isEmpty()) {
            return;
        }

        List<String> failedCompositeKeys = new ArrayList<>();

        for (Map.Entry<String, Map<String, SseEmitter>> quizEntry : quizEmitters.entrySet()) {
            String quizId = quizEntry.getKey();
            for (Map.Entry<String, SseEmitter> sessionEntry : quizEntry.getValue().entrySet()) {
                String sessionId = sessionEntry.getKey();
                SseEmitter emitter = sessionEntry.getValue();
                try {
                    emitter.send(SseEmitter.event()
                        .name("KEEP_ALIVE")
                        .data(Map.of("timestamp", Instant.now().toString()))
                        .reconnectTime(3000));

                    SessionMetadata metadata = sessionInfo.get(sessionId);
                    if (metadata != null) {
                        metadata.lastActivityAt = System.currentTimeMillis();
                    }
                } catch (IOException e) {
                    failedCompositeKeys.add(quizId + "::" + sessionId);
                }
            }
        }

        for (String compositeKey : failedCompositeKeys) {
            String[] parts = compositeKey.split("::", 2);
            unregister(parts[0], parts[1]);
        }
    }

    /**
     * Internal method to send event to an emitter with proper formatting
     */
    private void sendEvent(SseEmitter emitter, SSEEvent event, String sessionId) throws IOException {
        try {
            String eventName = event.getType() != null
                    ? event.getType().name()
                    : SSEEvent.EventType.ERROR.name();

            // Send as SSE format: data: {json}\n\n
            SseEmitter.SseEventBuilder sseEvent = SseEmitter.event()
                .id(Objects.requireNonNull(event.getEventId(), "eventId must not be null"))
                .name(eventName)
                .data(Objects.requireNonNull(event.getData(), "event data must not be null"))
                .reconnectTime(event.getRetryMs());

            emitter.send(sseEvent);
            
            // Update last activity
            SessionMetadata metadata = sessionInfo.get(sessionId);
            if (metadata != null) {
                metadata.lastActivityAt = System.currentTimeMillis();
            }
        } catch (IOException e) {
            throw e;
        }
    }

    /**
     * Handles SSE emitter timeout
     */
    private void handleEmitterTimeout(String quizId, String sessionId) {
        log.info("SSE emitter timeout for session {} in quiz {}", sessionId, quizId);
        unregister(quizId, sessionId);
    }

    /**
     * Handles SSE emitter completion
     */
    private void handleEmitterCompletion(String quizId, String sessionId) {
        log.info("SSE emitter completed for session {} in quiz {}", sessionId, quizId);
        unregister(quizId, sessionId);
    }

    private void broadcastTeamDisconnected(String quizId, String teamId) {
        try {
            Long parsedTeamId = Long.parseLong(teamId);
            TeamConnectionMessage connectionMessage = new TeamConnectionMessage(
                    "TEAM_DISCONNECTED",
                    parsedTeamId,
                    null,
                    Instant.now().toString()
            );
            SSEEvent event = SSEEvent.create(SSEEvent.EventType.TEAM_DISCONNECTED, connectionMessage);
            broadcast(quizId, event);
        } catch (NumberFormatException ignored) {
            log.debug("Skipping TEAM_DISCONNECTED broadcast for non-numeric teamId={}", teamId);
        }
    }
}
