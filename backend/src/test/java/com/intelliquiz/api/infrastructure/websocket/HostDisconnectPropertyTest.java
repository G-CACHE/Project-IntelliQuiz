package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for host disconnect handling.
 * Feature: websocket-realtime
 */
class HostDisconnectPropertyTest {

    /**
     * Feature: websocket-realtime, Property 18: Host Disconnect Pauses Timer
     * For any active timer, when the host disconnects, the timer SHALL pause
     * (stop decrementing) until the host reconnects.
     * 
     * **Validates: Requirements 9.4**
     */
    @Example
    void hostDisconnectPausesActiveTimer() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 30;
        
        // Start a question timer
        timerService.startQuestionTimer(quizId, 100L, duration, (qId) -> {});
        
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should be active before pause")
                .isTrue();
        
        int remainingBeforePause = timerService.getRemainingSeconds(quizId);
        
        // Simulate host disconnect by pausing timer
        timerService.pauseTimer(quizId);
        
        assertThat(timerService.isTimerPaused(quizId))
                .as("Timer should be paused after host disconnect")
                .isTrue();
        
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should not be active when paused")
                .isFalse();
        
        assertThat(timerService.getRemainingSeconds(quizId))
                .as("Remaining time should be preserved when paused")
                .isEqualTo(remainingBeforePause);
        
        // Verify pause broadcast was sent
        verify(broadcastService).broadcastTimerPaused(eq(quizId), eq(remainingBeforePause), eq(duration));
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Property: Host reconnect resumes timer from paused state.
     */
    @Example
    void hostReconnectResumesTimer() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 30;
        
        // Start and pause timer
        timerService.startQuestionTimer(quizId, 100L, duration, (qId) -> {});
        timerService.pauseTimer(quizId);
        
        int remainingWhenPaused = timerService.getRemainingSeconds(quizId);
        
        // Resume timer (host reconnected)
        timerService.resumeTimer(quizId, (qId) -> {});
        
        assertThat(timerService.isTimerPaused(quizId))
                .as("Timer should not be paused after resume")
                .isFalse();
        
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should be active after resume")
                .isTrue();
        
        assertThat(timerService.getRemainingSeconds(quizId))
                .as("Remaining time should be same as when paused")
                .isEqualTo(remainingWhenPaused);
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Property: Pausing non-existent timer is safe (no-op).
     */
    @Example
    void pausingNonExistentTimerIsSafe() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 999L;
        
        // Should not throw
        timerService.pauseTimer(quizId);
        
        assertThat(timerService.isTimerPaused(quizId))
                .as("Non-existent timer should not be marked as paused")
                .isFalse();
        
        // No broadcast should be sent
        verify(broadcastService, never()).broadcastTimerPaused(anyLong(), anyInt(), anyInt());
    }

    /**
     * Property: Resuming non-paused timer is safe (no-op).
     */
    @Example
    void resumingNonPausedTimerIsSafe() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 30;
        
        // Start timer but don't pause
        timerService.startQuestionTimer(quizId, 100L, duration, (qId) -> {});
        
        // Clear mock to check only resume calls
        reset(broadcastService);
        
        // Try to resume (should be no-op since not paused)
        timerService.resumeTimer(quizId, (qId) -> {});
        
        // Timer should still be active (not affected)
        assertThat(timerService.isTimerActive(quizId)).isTrue();
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Property: Session manager tracks host connection status.
     */
    @Example
    void sessionManagerTracksHostConnection() {
        QuizSessionManager sessionManager = new QuizSessionManager();
        
        Long quizId = 1L;
        String hostSessionId = "host-session-123";
        
        // Initially no host
        assertThat(sessionManager.isHostConnected(quizId))
                .as("No host should be connected initially")
                .isFalse();
        
        // Register host
        sessionManager.registerHost(quizId, hostSessionId);
        
        assertThat(sessionManager.isHostConnected(quizId))
                .as("Host should be connected after registration")
                .isTrue();
        
        assertThat(sessionManager.getHostSessionId(quizId))
                .as("Host session ID should be retrievable")
                .isPresent()
                .hasValue(hostSessionId);
        
        // Unregister host
        sessionManager.unregister(hostSessionId);
        
        assertThat(sessionManager.isHostConnected(quizId))
                .as("Host should not be connected after unregistration")
                .isFalse();
    }
}
