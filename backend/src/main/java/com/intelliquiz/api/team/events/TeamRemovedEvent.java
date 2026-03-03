package com.intelliquiz.api.team.events;

/**
 * Event published when a team is removed from a quiz.
 */
public record TeamRemovedEvent(Long teamId, String teamName, Long quizId) {
}
