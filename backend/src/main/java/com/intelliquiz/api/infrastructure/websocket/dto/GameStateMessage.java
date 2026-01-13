package com.intelliquiz.api.infrastructure.websocket.dto;

import com.intelliquiz.api.infrastructure.websocket.GameState;

/**
 * Game state broadcast message to all clients.
 */
public record GameStateMessage(
        GameState state,
        Long quizId,
        Integer currentQuestionIndex,
        Integer totalQuestions,
        String currentRound,
        String message
) {
    public static GameStateMessage lobby(Long quizId, String message) {
        return new GameStateMessage(GameState.LOBBY, quizId, null, null, null, message);
    }
    
    public static GameStateMessage buffer(Long quizId, String roundName, String message) {
        return new GameStateMessage(GameState.BUFFER, quizId, null, null, roundName, message);
    }
    
    public static GameStateMessage active(Long quizId, int questionIndex, int totalQuestions, String round) {
        return new GameStateMessage(GameState.ACTIVE, quizId, questionIndex, totalQuestions, round, null);
    }
    
    public static GameStateMessage grading(Long quizId) {
        return new GameStateMessage(GameState.GRADING, quizId, null, null, null, "Processing answers...");
    }
    
    public static GameStateMessage reveal(Long quizId) {
        return new GameStateMessage(GameState.REVEAL, quizId, null, null, null, null);
    }
    
    public static GameStateMessage roundSummary(Long quizId, String roundName) {
        return new GameStateMessage(GameState.ROUND_SUMMARY, quizId, null, null, roundName, null);
    }
    
    public static GameStateMessage ended(Long quizId) {
        return new GameStateMessage(GameState.ENDED, quizId, null, null, null, "Quiz ended");
    }
    
    public static GameStateMessage paused(Long quizId, String message) {
        return new GameStateMessage(GameState.PAUSED, quizId, null, null, null, message);
    }
}
