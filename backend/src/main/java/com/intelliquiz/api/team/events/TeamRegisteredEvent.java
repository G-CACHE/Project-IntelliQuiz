package com.intelliquiz.api.team.events;

/**
 * Event published when a new team registers for a quiz.
 */
public record TeamRegisteredEvent(Long teamId, String teamName, Long quizId) {
}
