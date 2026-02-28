package com.intelliquiz.api.realtime;

import com.intelliquiz.api.realtime.internal.application.services.GameFlowService;
import com.intelliquiz.api.realtime.internal.application.services.QuizSessionManager;
import com.intelliquiz.api.realtime.internal.application.services.QuizBroadcastService;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import org.springframework.stereotype.Service;

/**
 * Public facade for the realtime module.
 * Provides cross-module access to real-time quiz session operations.
 */
@Service
public class RealtimeFacade {

    private final GameFlowService gameFlowService;
    private final QuizSessionManager sessionManager;
    private final QuizBroadcastService broadcastService;

    public RealtimeFacade(GameFlowService gameFlowService,
                          QuizSessionManager sessionManager,
                          QuizBroadcastService broadcastService) {
        this.gameFlowService = gameFlowService;
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
    }

    /**
     * Checks if a quiz session is currently active.
     */
    public boolean isSessionActive(Long quizId) {
        GameState state = sessionManager.getCurrentState(quizId);
        return state != GameState.LOBBY && state != GameState.ENDED;
    }

    /**
     * Gets the current game state for a quiz.
     */
    public String getCurrentState(Long quizId) {
        return sessionManager.getCurrentState(quizId).name();
    }

    /**
     * Gets the count of connected teams for a quiz.
     */
    public int getConnectedTeamCount(Long quizId) {
        return sessionManager.getConnectedTeamCount(quizId);
    }

    /**
     * Broadcasts a message to all participants in a quiz.
     */
    public void broadcastToQuiz(Long quizId, Object message) {
        broadcastService.sendToHost(quizId, null); // placeholder — extend as needed
    }
}
