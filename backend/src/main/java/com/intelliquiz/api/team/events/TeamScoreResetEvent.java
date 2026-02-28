package com.intelliquiz.api.team.events;

/**
 * Event published when all team scores are reset for a quiz.
 */
public record TeamScoreResetEvent(Long quizId) {
}
