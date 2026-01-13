package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import com.intelliquiz.api.infrastructure.websocket.dto.GameStateMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.*;
import java.util.function.Consumer;

/**
 * Server-authoritative timer service for quiz questions.
 * Manages countdown timers with automatic state transitions.
 */
@Service
public class QuizTimerService {

    private static final Logger logger = LoggerFactory.getLogger(QuizTimerService.class);

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    
    // Quiz ID -> Timer state
    private final Map<Long, TimerState> timers = new ConcurrentHashMap<>();
    
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;

    public QuizTimerService(QuizBroadcastService broadcastService, QuizSessionManager sessionManager) {
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
    }

    /**
     * Starts a buffer countdown (e.g., 10 seconds before round starts).
     * 
     * @param quizId the quiz ID
     * @param durationSeconds countdown duration
     * @param roundName the round name (e.g., "EASY", "MEDIUM")
     * @param onComplete callback when buffer completes
     */
    public void startBufferCountdown(Long quizId, int durationSeconds, String roundName, Runnable onComplete) {
        stopTimer(quizId); // Cancel any existing timer
        
        TimerState state = new TimerState(durationSeconds, durationSeconds, true, false, null);
        timers.put(quizId, state);
        
        // Broadcast initial state
        broadcastService.broadcastGameState(quizId, GameStateMessage.buffer(quizId, roundName, "GET READY!"));
        broadcastService.broadcastBufferTick(quizId, durationSeconds, roundName);
        
        // Schedule tick every second
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
            TimerState current = timers.get(quizId);
            if (current == null || current.isPaused()) return;
            
            int remaining = current.remainingSeconds() - 1;
            
            if (remaining <= 0) {
                // Buffer complete
                stopTimer(quizId);
                broadcastService.broadcastBufferTick(quizId, 0, roundName);
                if (onComplete != null) {
                    onComplete.run();
                }
            } else {
                // Update and broadcast
                timers.put(quizId, current.withRemaining(remaining));
                broadcastService.broadcastBufferTick(quizId, remaining, roundName);
            }
        }, 1, 1, TimeUnit.SECONDS);
        
        timers.put(quizId, state.withFuture(future));
        logger.info("Started buffer countdown for quiz {} ({} seconds)", quizId, durationSeconds);
    }

    /**
     * Starts a question timer.
     * 
     * @param quizId the quiz ID
     * @param questionId the question ID
     * @param durationSeconds timer duration
     * @param onExpired callback when timer expires
     */
    public void startQuestionTimer(Long quizId, Long questionId, int durationSeconds, Consumer<Long> onExpired) {
        stopTimer(quizId); // Cancel any existing timer
        
        TimerState state = new TimerState(durationSeconds, durationSeconds, true, false, null);
        timers.put(quizId, state);
        
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        // Broadcast initial tick
        broadcastService.broadcastTimerTick(quizId, durationSeconds, durationSeconds);
        
        // Schedule tick every second
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
            TimerState current = timers.get(quizId);
            if (current == null || current.isPaused()) return;
            
            int remaining = current.remainingSeconds() - 1;
            
            if (remaining <= 0) {
                // Timer expired
                stopTimer(quizId);
                broadcastService.broadcastTimerExpired(quizId, current.totalSeconds());
                
                // Auto-transition to GRADING
                broadcastService.broadcastGameState(quizId, GameStateMessage.grading(quizId));
                
                if (onExpired != null) {
                    onExpired.accept(questionId);
                }
            } else {
                // Update and broadcast
                timers.put(quizId, current.withRemaining(remaining));
                broadcastService.broadcastTimerTick(quizId, remaining, current.totalSeconds());
            }
        }, 1, 1, TimeUnit.SECONDS);
        
        timers.put(quizId, state.withFuture(future));
        logger.info("Started question timer for quiz {} question {} ({} seconds)", quizId, questionId, durationSeconds);
    }

    /**
     * Stops the timer for a quiz.
     */
    public void stopTimer(Long quizId) {
        TimerState state = timers.remove(quizId);
        if (state != null && state.future() != null) {
            state.future().cancel(false);
            logger.debug("Stopped timer for quiz {}", quizId);
        }
    }

    /**
     * Pauses the timer for a quiz (e.g., when host disconnects).
     */
    public void pauseTimer(Long quizId) {
        TimerState state = timers.get(quizId);
        if (state != null && state.isActive() && !state.isPaused()) {
            // Cancel the scheduled task but keep the state
            if (state.future() != null) {
                state.future().cancel(false);
            }
            timers.put(quizId, state.paused());
            broadcastService.broadcastTimerPaused(quizId, state.remainingSeconds(), state.totalSeconds());
            broadcastService.broadcastGameState(quizId, GameStateMessage.paused(quizId, "Timer paused"));
            logger.info("Paused timer for quiz {} at {} seconds", quizId, state.remainingSeconds());
        }
    }

    /**
     * Resumes the timer for a quiz.
     * 
     * @param onExpired callback when timer expires
     */
    public void resumeTimer(Long quizId, Consumer<Long> onExpired) {
        TimerState state = timers.get(quizId);
        if (state != null && state.isPaused()) {
            int remaining = state.remainingSeconds();
            int total = state.totalSeconds();
            
            // Restart the timer from where it was paused
            TimerState newState = new TimerState(remaining, total, true, false, null);
            timers.put(quizId, newState);
            
            // Broadcast resume
            broadcastService.broadcastTimerTick(quizId, remaining, total);
            broadcastService.broadcastGameState(quizId, GameStateMessage.active(
                    quizId, 
                    sessionManager.getCurrentQuestionIndex(quizId),
                    0, // Will be set by caller
                    null
            ));
            
            // Schedule remaining ticks
            Long questionId = sessionManager.getCurrentQuestionId(quizId).orElse(null);
            
            ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
                TimerState current = timers.get(quizId);
                if (current == null || current.isPaused()) return;
                
                int rem = current.remainingSeconds() - 1;
                
                if (rem <= 0) {
                    stopTimer(quizId);
                    broadcastService.broadcastTimerExpired(quizId, current.totalSeconds());
                    broadcastService.broadcastGameState(quizId, GameStateMessage.grading(quizId));
                    if (onExpired != null && questionId != null) {
                        onExpired.accept(questionId);
                    }
                } else {
                    timers.put(quizId, current.withRemaining(rem));
                    broadcastService.broadcastTimerTick(quizId, rem, current.totalSeconds());
                }
            }, 1, 1, TimeUnit.SECONDS);
            
            timers.put(quizId, newState.withFuture(future));
            logger.info("Resumed timer for quiz {} with {} seconds remaining", quizId, remaining);
        }
    }

    /**
     * Checks if a timer is active for a quiz.
     */
    public boolean isTimerActive(Long quizId) {
        TimerState state = timers.get(quizId);
        return state != null && state.isActive() && !state.isPaused();
    }

    /**
     * Checks if a timer is paused for a quiz.
     */
    public boolean isTimerPaused(Long quizId) {
        TimerState state = timers.get(quizId);
        return state != null && state.isPaused();
    }

    /**
     * Gets the remaining seconds for a quiz timer.
     */
    public int getRemainingSeconds(Long quizId) {
        TimerState state = timers.get(quizId);
        return state != null ? state.remainingSeconds() : 0;
    }

    /**
     * Gets the total seconds for a quiz timer.
     */
    public int getTotalSeconds(Long quizId) {
        TimerState state = timers.get(quizId);
        return state != null ? state.totalSeconds() : 0;
    }

    /**
     * Timer state record.
     */
    private record TimerState(
            int remainingSeconds,
            int totalSeconds,
            boolean isActive,
            boolean isPaused,
            ScheduledFuture<?> future
    ) {
        TimerState withRemaining(int remaining) {
            return new TimerState(remaining, totalSeconds, isActive, isPaused, future);
        }
        
        TimerState withFuture(ScheduledFuture<?> newFuture) {
            return new TimerState(remainingSeconds, totalSeconds, isActive, isPaused, newFuture);
        }
        
        TimerState paused() {
            return new TimerState(remainingSeconds, totalSeconds, isActive, true, null);
        }
    }
}
