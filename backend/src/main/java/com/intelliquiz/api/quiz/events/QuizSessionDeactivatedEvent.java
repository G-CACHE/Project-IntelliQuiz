package com.intelliquiz.api.quiz.events;

import java.time.Instant;

/**
 * Event published when a quiz live session is deactivated.
 */
public record QuizSessionDeactivatedEvent(Long quizId, Instant occurredAt) {}
