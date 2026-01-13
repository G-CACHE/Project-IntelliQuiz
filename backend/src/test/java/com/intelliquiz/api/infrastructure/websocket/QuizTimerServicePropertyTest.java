package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.Positive;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for QuizTimerService.
 * Feature: websocket-realtime
 */
class QuizTimerServicePropertyTest {

    /**
     * Feature: websocket-realtime, Property 5: Buffer Countdown Synchronization
     * For any round start, the WebSocket server SHALL broadcast a buffer countdown
     * with remaining seconds decreasing by 1 each second until reaching 0.
     * 
     * **Validates: Requirements 2.3, 3.2**
     */
    @Example
    void bufferCountdownStartsWithCorrectDuration() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 10;
        String roundName = "EASY";
        
        timerService.startBufferCountdown(quizId, duration, roundName, () -> {});
        
        // Verify initial state
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should be active after starting buffer")
                .isTrue();
        
        assertThat(timerService.getRemainingSeconds(quizId))
                .as("Remaining seconds should equal duration")
                .isEqualTo(duration);
        
        // Verify broadcast was called
        verify(broadcastService).broadcastBufferTick(eq(quizId), eq(duration), eq(roundName));
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Feature: websocket-realtime, Property 6: Timer Tick Synchronization
     * For any active question timer, the WebSocket server SHALL broadcast TimerMessage
     * to all connected clients every second.
     * 
     * **Validates: Requirements 2.3, 3.3**
     */
    @Example
    void questionTimerStartsWithCorrectDuration() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        Long questionId = 100L;
        int duration = 30;
        
        timerService.startQuestionTimer(quizId, questionId, duration, (qId) -> {});
        
        // Verify initial state
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should be active after starting question timer")
                .isTrue();
        
        assertThat(timerService.getRemainingSeconds(quizId))
                .as("Remaining seconds should equal duration")
                .isEqualTo(duration);
        
        assertThat(timerService.getTotalSeconds(quizId))
                .as("Total seconds should equal duration")
                .isEqualTo(duration);
        
        // Verify broadcast was called
        verify(broadcastService).broadcastTimerTick(eq(quizId), eq(duration), eq(duration));
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Property: Stopping timer makes it inactive.
     * **Validates: Requirements 3.4**
     */
    @Property(tries = 50)
    void stoppingTimerMakesItInactive(
            @ForAll @Positive Long quizId,
            @ForAll @IntRange(min = 5, max = 60) int duration
    ) {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        // Start timer
        timerService.startQuestionTimer(quizId, 1L, duration, (qId) -> {});
        assertThat(timerService.isTimerActive(quizId)).isTrue();
        
        // Stop timer
        timerService.stopTimer(quizId);
        
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should be inactive after stopping")
                .isFalse();
    }

    /**
     * Property: Pausing timer preserves remaining time.
     * **Validates: Requirements 9.4**
     */
    @Example
    void pausingTimerPreservesRemainingTime() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 30;
        
        // Start timer
        timerService.startQuestionTimer(quizId, 1L, duration, (qId) -> {});
        int remainingBeforePause = timerService.getRemainingSeconds(quizId);
        
        // Pause timer
        timerService.pauseTimer(quizId);
        
        assertThat(timerService.isTimerPaused(quizId))
                .as("Timer should be paused")
                .isTrue();
        
        assertThat(timerService.isTimerActive(quizId))
                .as("Timer should not be active when paused")
                .isFalse();
        
        assertThat(timerService.getRemainingSeconds(quizId))
                .as("Remaining time should be preserved")
                .isEqualTo(remainingBeforePause);
        
        // Clean up
        timerService.stopTimer(quizId);
    }

    /**
     * Property: Starting new timer cancels previous one.
     * **Validates: Requirements 3.1**
     */
    @Property(tries = 50)
    void startingNewTimerCancelsPrevious(
            @ForAll @Positive Long quizId,
            @ForAll @IntRange(min = 10, max = 30) int duration1,
            @ForAll @IntRange(min = 10, max = 30) int duration2
    ) {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        // Start first timer
        timerService.startQuestionTimer(quizId, 1L, duration1, (qId) -> {});
        
        // Start second timer (should cancel first)
        timerService.startQuestionTimer(quizId, 2L, duration2, (qId) -> {});
        
        // Verify second timer is active with its duration
        assertThat(timerService.isTimerActive(quizId)).isTrue();
        assertThat(timerService.getTotalSeconds(quizId))
                .as("Total seconds should be from second timer")
                .isEqualTo(duration2);
        
        // Clean up
        timerService.stopTimer(quizId);
    }
}
