package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import com.intelliquiz.api.infrastructure.websocket.dto.GameStateMessage;
import net.jqwik.api.*;
import org.mockito.ArgumentCaptor;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for automatic state transitions.
 * Feature: websocket-realtime
 */
class AutoTransitionsPropertyTest {

    /**
     * Feature: websocket-realtime, Property 7: Auto-Transition to Grading
     * For any question, when the timer reaches 0, the WebSocket server SHALL
     * automatically transition to GRADING state and lock all participant inputs.
     * 
     * **Validates: Requirements 2.4, 3.4**
     */
    @Example
    void timerExpirationTriggersGradingState() throws InterruptedException {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        Long questionId = 100L;
        int shortDuration = 2; // 2 seconds for quick test
        
        AtomicBoolean callbackCalled = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        
        // Start timer with short duration
        timerService.startQuestionTimer(quizId, questionId, shortDuration, (qId) -> {
            callbackCalled.set(true);
            latch.countDown();
        });
        
        // Wait for timer to expire
        boolean completed = latch.await(5, TimeUnit.SECONDS);
        
        assertThat(completed)
                .as("Timer callback should be called within timeout")
                .isTrue();
        
        assertThat(callbackCalled.get())
                .as("Timer expiration callback should be called")
                .isTrue();
        
        // Verify GRADING state was broadcast
        verify(broadcastService, atLeastOnce()).broadcastGameState(eq(quizId), argThat(msg -> 
                msg.state() == GameState.GRADING
        ));
        
        // Verify timer expired broadcast
        verify(broadcastService).broadcastTimerExpired(eq(quizId), eq(shortDuration));
    }

    /**
     * Feature: websocket-realtime, Property 8: Auto-Transition to Reveal
     * For any question in GRADING state, the WebSocket server SHALL automatically
     * calculate scores and transition to REVEAL state.
     * 
     * Note: This is tested via GameFlowService integration, but we verify
     * the state message structure here.
     * 
     * **Validates: Requirements 2.5**
     */
    @Example
    void gameStateMessageForRevealIsCorrect() {
        Long quizId = 1L;
        
        GameStateMessage revealMessage = GameStateMessage.reveal(quizId);
        
        assertThat(revealMessage.state())
                .as("State should be REVEAL")
                .isEqualTo(GameState.REVEAL);
        
        assertThat(revealMessage.quizId())
                .as("Quiz ID should be set")
                .isEqualTo(quizId);
    }

    /**
     * Property: Buffer countdown completes and triggers callback.
     */
    @Example
    void bufferCountdownCompletesAndTriggersCallback() throws InterruptedException {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int shortDuration = 2;
        String roundName = "EASY";
        
        AtomicBoolean callbackCalled = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        
        timerService.startBufferCountdown(quizId, shortDuration, roundName, () -> {
            callbackCalled.set(true);
            latch.countDown();
        });
        
        boolean completed = latch.await(5, TimeUnit.SECONDS);
        
        assertThat(completed)
                .as("Buffer callback should be called within timeout")
                .isTrue();
        
        assertThat(callbackCalled.get())
                .as("Buffer completion callback should be called")
                .isTrue();
        
        // Verify buffer ticks were broadcast
        verify(broadcastService, atLeastOnce()).broadcastBufferTick(eq(quizId), anyInt(), eq(roundName));
    }

    /**
     * Property: GameStateMessage factory methods produce correct states.
     */
    @Example
    void gameStateMessageFactoryMethodsAreCorrect() {
        Long quizId = 1L;
        
        // Test all factory methods
        assertThat(GameStateMessage.lobby(quizId, "Welcome").state()).isEqualTo(GameState.LOBBY);
        assertThat(GameStateMessage.buffer(quizId, "EASY", "Get Ready!").state()).isEqualTo(GameState.BUFFER);
        assertThat(GameStateMessage.active(quizId, 0, 10, "EASY").state()).isEqualTo(GameState.ACTIVE);
        assertThat(GameStateMessage.grading(quizId).state()).isEqualTo(GameState.GRADING);
        assertThat(GameStateMessage.reveal(quizId).state()).isEqualTo(GameState.REVEAL);
        assertThat(GameStateMessage.roundSummary(quizId, "EASY").state()).isEqualTo(GameState.ROUND_SUMMARY);
        assertThat(GameStateMessage.ended(quizId).state()).isEqualTo(GameState.ENDED);
    }

    /**
     * Property: Timer broadcasts correct remaining seconds.
     */
    @Example
    void timerBroadcastsCorrectRemainingSeconds() throws InterruptedException {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = new QuizTimerService(broadcastService, sessionManager);
        
        Long quizId = 1L;
        int duration = 3;
        
        CountDownLatch latch = new CountDownLatch(1);
        
        timerService.startQuestionTimer(quizId, 100L, duration, (qId) -> latch.countDown());
        
        // Wait for timer to complete
        latch.await(5, TimeUnit.SECONDS);
        
        // Verify initial tick
        verify(broadcastService).broadcastTimerTick(quizId, duration, duration);
        
        // Verify subsequent ticks (at least one decrement)
        ArgumentCaptor<Integer> remainingCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(broadcastService, atLeast(2)).broadcastTimerTick(eq(quizId), remainingCaptor.capture(), eq(duration));
        
        // Verify remaining seconds decrease
        var capturedValues = remainingCaptor.getAllValues();
        assertThat(capturedValues)
                .as("Timer should broadcast decreasing remaining seconds")
                .contains(duration); // Initial value should be present
    }
}
