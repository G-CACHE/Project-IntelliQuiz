package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.intelliquiz.api.realtime.internal.domain.enums.GameState;

/**
 * Game state broadcast message to all clients.
 * Includes optional currentQuestion for ACTIVE state so clients
 * receive game state + question data in a single message.
 */
public record GameStateMessage(
        GameState state,
        Long quizId,
        Integer currentQuestionIndex,
        Integer totalQuestions,
        String currentRound,
        String message,
        QuestionPayload currentQuestion,
        Boolean participantNavigationEnabled
) {
    public static GameStateMessage lobby(Long quizId, String message) {
        return new GameStateMessage(GameState.LOBBY, quizId, null, null, null, message, null, false);
    }
    
    public static GameStateMessage buffer(Long quizId, String roundName, String message) {
        return new GameStateMessage(GameState.BUFFER, quizId, null, null, roundName, message, null, false);
    }
    
    public static GameStateMessage active(Long quizId, int questionIndex, int totalQuestions, String round, QuestionPayload question) {
        return new GameStateMessage(GameState.ACTIVE, quizId, questionIndex, totalQuestions, round, null, question, false);
    }

    public static GameStateMessage active(Long quizId, int questionIndex, int totalQuestions, String round, QuestionPayload question, boolean participantNavEnabled) {
        return new GameStateMessage(GameState.ACTIVE, quizId, questionIndex, totalQuestions, round, null, question, participantNavEnabled);
    }
    
    public static GameStateMessage grading(Long quizId) {
        return new GameStateMessage(GameState.GRADING, quizId, null, null, null, "Processing answers...", null, false);
    }
    
    public static GameStateMessage reveal(Long quizId) {
        return new GameStateMessage(GameState.REVEAL, quizId, null, null, null, null, null, false);
    }
    
    public static GameStateMessage roundSummary(Long quizId, String roundName) {
        return new GameStateMessage(GameState.ROUND_SUMMARY, quizId, null, null, roundName, null, null, false);
    }
    
    public static GameStateMessage ended(Long quizId) {
        return new GameStateMessage(GameState.ENDED, quizId, null, null, null, "Quiz ended", null, false);
    }
    
    public static GameStateMessage paused(Long quizId, String message) {
        return new GameStateMessage(GameState.PAUSED, quizId, null, null, null, message, null, false);
    }
}
