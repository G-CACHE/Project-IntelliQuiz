package com.intelliquiz.api.infrastructure.config;

import com.intelliquiz.api.infrastructure.websocket.GameState;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages WebSocket session state for quiz games.
 * Tracks connected hosts and participants, current game state, and question index.
 */
@Service
public class QuizSessionManager {

    // Session ID -> Connection info
    private final Map<String, ClientConnection> connections = new ConcurrentHashMap<>();
    
    // Quiz ID -> Host session ID
    private final Map<Long, String> hostSessions = new ConcurrentHashMap<>();
    
    // Quiz ID -> Set of connected team IDs
    private final Map<Long, Set<Long>> connectedTeams = new ConcurrentHashMap<>();
    
    // Quiz ID -> Current game state
    private final Map<Long, GameState> gameStates = new ConcurrentHashMap<>();
    
    // Quiz ID -> Current question index
    private final Map<Long, Integer> questionIndices = new ConcurrentHashMap<>();
    
    // Quiz ID -> Current question ID
    private final Map<Long, Long> currentQuestions = new ConcurrentHashMap<>();

    /**
     * Registers a host connection for a quiz.
     */
    public void registerHost(Long quizId, String sessionId) {
        connections.put(sessionId, new ClientConnection(sessionId, quizId, null, true, Instant.now(), false));
        hostSessions.put(quizId, sessionId);
        gameStates.putIfAbsent(quizId, GameState.LOBBY);
    }

    /**
     * Registers a participant (team) connection for a quiz.
     */
    public void registerParticipant(Long quizId, Long teamId, String sessionId) {
        connections.put(sessionId, new ClientConnection(sessionId, quizId, teamId, false, Instant.now(), false));
        connectedTeams.computeIfAbsent(quizId, k -> ConcurrentHashMap.newKeySet()).add(teamId);
    }

    /**
     * Unregisters a connection by session ID.
     */
    public void unregister(String sessionId) {
        ClientConnection conn = connections.remove(sessionId);
        if (conn == null) return;
        
        if (conn.isHost()) {
            hostSessions.remove(conn.quizId());
        } else if (conn.teamId() != null) {
            Set<Long> teams = connectedTeams.get(conn.quizId());
            if (teams != null) {
                teams.remove(conn.teamId());
            }
        }
    }

    /**
     * Gets connection info by session ID.
     */
    public Optional<ClientConnection> getConnection(String sessionId) {
        return Optional.ofNullable(connections.get(sessionId));
    }

    /**
     * Gets all connected team IDs for a quiz.
     */
    public Set<Long> getConnectedTeams(Long quizId) {
        return connectedTeams.getOrDefault(quizId, Set.of());
    }

    /**
     * Gets the count of connected teams for a quiz.
     */
    public int getConnectedTeamCount(Long quizId) {
        return getConnectedTeams(quizId).size();
    }

    /**
     * Checks if the host is connected for a quiz.
     */
    public boolean isHostConnected(Long quizId) {
        return hostSessions.containsKey(quizId);
    }

    /**
     * Gets the host session ID for a quiz.
     */
    public Optional<String> getHostSessionId(Long quizId) {
        return Optional.ofNullable(hostSessions.get(quizId));
    }

    /**
     * Gets the current game state for a quiz.
     */
    public GameState getCurrentState(Long quizId) {
        return gameStates.getOrDefault(quizId, GameState.LOBBY);
    }

    /**
     * Sets the current game state for a quiz.
     */
    public void setCurrentState(Long quizId, GameState state) {
        gameStates.put(quizId, state);
    }

    /**
     * Gets the current question index for a quiz.
     */
    public int getCurrentQuestionIndex(Long quizId) {
        return questionIndices.getOrDefault(quizId, 0);
    }

    /**
     * Sets the current question index for a quiz.
     */
    public void setCurrentQuestionIndex(Long quizId, int index) {
        questionIndices.put(quizId, index);
    }

    /**
     * Gets the current question ID for a quiz.
     */
    public Optional<Long> getCurrentQuestionId(Long quizId) {
        return Optional.ofNullable(currentQuestions.get(quizId));
    }

    /**
     * Sets the current question ID for a quiz.
     */
    public void setCurrentQuestionId(Long quizId, Long questionId) {
        currentQuestions.put(quizId, questionId);
    }

    /**
     * Checks if a team is connected to a quiz.
     */
    public boolean isTeamConnected(Long quizId, Long teamId) {
        return getConnectedTeams(quizId).contains(teamId);
    }

    /**
     * Clears all session data for a quiz (on quiz end).
     */
    public void clearQuizSession(Long quizId) {
        // Remove host session
        String hostSession = hostSessions.remove(quizId);
        if (hostSession != null) {
            connections.remove(hostSession);
        }
        
        // Remove all team connections
        Set<Long> teams = connectedTeams.remove(quizId);
        if (teams != null) {
            connections.entrySet().removeIf(e -> 
                    e.getValue().quizId().equals(quizId) && !e.getValue().isHost());
        }
        
        // Clear state
        gameStates.remove(quizId);
        questionIndices.remove(quizId);
        currentQuestions.remove(quizId);
    }

    /**
     * Connection record for tracking client sessions.
     */
    public record ClientConnection(
            String sessionId,
            Long quizId,
            Long teamId,
            boolean isHost,
            Instant connectedAt,
            boolean isSpectator
    ) {}
}
