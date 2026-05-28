package com.intelliquiz.api.quiz.events;

import java.time.Instant;

/**
 * Event published when a quiz live session is activated.
 */
public record QuizSessionActivatedEvent(Long quizId, Instant occurredAt) {}
