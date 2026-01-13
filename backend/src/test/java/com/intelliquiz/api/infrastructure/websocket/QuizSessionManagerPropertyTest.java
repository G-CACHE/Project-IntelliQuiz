package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.Positive;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for QuizSessionManager.
 * Feature: websocket-realtime
 */
class QuizSessionManagerPropertyTest {

    /**
     * Feature: websocket-realtime, Property 15: Team Connection Count Accuracy
     * For any quiz session, the connected team count reported to the host SHALL equal
     * the actual number of teams with active WebSocket connections.
     * 
     * **Validates: Requirements 4.1, 4.3, 4.4**
     */
    @Property(tries = 100)
    void connectedTeamCountMatchesActualConnections(
            @ForAll @Positive Long quizId,
            @ForAll @IntRange(min = 1, max = 20) int teamCount
    ) {
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        // Register host
        sessionManager.registerHost(quizId, "host-session-" + quizId);
        
        // Register teams
        Set<Long> registeredTeams = new HashSet<>();
        for (int i = 0; i < teamCount; i++) {
            Long teamId = (long) (i + 1);
            String sessionId = "team-session-" + teamId;
            sessionManager.registerParticipant(quizId, teamId, sessionId);
            registeredTeams.add(teamId);
        }
        
        // Verify count matches
        assertThat(sessionManager.getConnectedTeamCount(quizId))
                .as("Connected team count should match registered teams")
                .isEqualTo(teamCount);
        
        // Verify all teams are tracked
        assertThat(sessionManager.getConnectedTeams(quizId))
                .as("All registered teams should be tracked")
                .containsExactlyInAnyOrderElementsOf(registeredTeams);
    }

    /**
     * Property: Unregistering a team decreases the count by 1.
     * **Validates: Requirements 4.2, 4.3**
     */
    @Property(tries = 100)
    void unregisteringTeamDecreasesCount(
            @ForAll @Positive Long quizId,
            @ForAll @IntRange(min = 2, max = 10) int teamCount
    ) {
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        // Register host and teams
        sessionManager.registerHost(quizId, "host-session");
        for (int i = 0; i < teamCount; i++) {
            sessionManager.registerParticipant(quizId, (long) (i + 1), "team-session-" + i);
        }
        
        int initialCount = sessionManager.getConnectedTeamCount(quizId);
        
        // Unregister one team
        sessionManager.unregister("team-session-0");
        
        assertThat(sessionManager.getConnectedTeamCount(quizId))
                .as("Count should decrease by 1 after unregistering")
                .isEqualTo(initialCount - 1);
    }

    /**
     * Property: Host connection status is accurate.
     * **Validates: Requirements 4.1**
     */
    @Property(tries = 100)
    void hostConnectionStatusIsAccurate(@ForAll @Positive Long quizId) {
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        // Initially no host
        assertThat(sessionManager.isHostConnected(quizId))
                .as("No host should be connected initially")
                .isFalse();
        
        // Register host
        String hostSession = "host-" + UUID.randomUUID();
        sessionManager.registerHost(quizId, hostSession);
        
        assertThat(sessionManager.isHostConnected(quizId))
                .as("Host should be connected after registration")
                .isTrue();
        
        assertThat(sessionManager.getHostSessionId(quizId))
                .as("Host session ID should be retrievable")
                .isPresent()
                .hasValue(hostSession);
        
        // Unregister host
        sessionManager.unregister(hostSession);
        
        assertThat(sessionManager.isHostConnected(quizId))
                .as("Host should not be connected after unregistration")
                .isFalse();
    }

    /**
     * Property: Game state is correctly tracked per quiz.
     * **Validates: Requirements 7.1**
     */
    @Property(tries = 100)
    void gameStateIsTrackedPerQuiz(
            @ForAll @Positive Long quizId1,
            @ForAll @Positive Long quizId2
    ) {
        Assume.that(!quizId1.equals(quizId2));
        
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        // Set different states for different quizzes
        sessionManager.setCurrentState(quizId1, GameState.ACTIVE);
        sessionManager.setCurrentState(quizId2, GameState.REVEAL);
        
        assertThat(sessionManager.getCurrentState(quizId1))
                .as("Quiz 1 should have ACTIVE state")
                .isEqualTo(GameState.ACTIVE);
        
        assertThat(sessionManager.getCurrentState(quizId2))
                .as("Quiz 2 should have REVEAL state")
                .isEqualTo(GameState.REVEAL);
    }

    /**
     * Property: Clearing quiz session removes all data.
     * **Validates: Requirements 7.6**
     */
    @Property(tries = 100)
    void clearingSessionRemovesAllData(
            @ForAll @Positive Long quizId,
            @ForAll @IntRange(min = 1, max = 5) int teamCount
    ) {
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        // Set up session
        sessionManager.registerHost(quizId, "host-session");
        for (int i = 0; i < teamCount; i++) {
            sessionManager.registerParticipant(quizId, (long) (i + 1), "team-session-" + i);
        }
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionIndex(quizId, 5);
        
        // Clear session
        sessionManager.clearQuizSession(quizId);
        
        // Verify all data is cleared
        assertThat(sessionManager.isHostConnected(quizId)).isFalse();
        assertThat(sessionManager.getConnectedTeamCount(quizId)).isZero();
        assertThat(sessionManager.getCurrentState(quizId)).isEqualTo(GameState.LOBBY);
        assertThat(sessionManager.getCurrentQuestionIndex(quizId)).isZero();
    }
}
