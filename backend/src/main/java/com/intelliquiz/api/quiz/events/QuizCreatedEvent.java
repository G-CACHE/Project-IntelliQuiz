package com.intelliquiz.api.quiz.events;

import java.time.Instant;

/**
 * Event published when a new quiz is created.
 */
public record QuizCreatedEvent(Long quizId, String title, Instant occurredAt) {}
