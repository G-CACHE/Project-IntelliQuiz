package com.intelliquiz.api.quiz.events;

import java.time.Instant;

/**
 * Event published when a question is deleted from a quiz.
 */
public record QuestionDeletedEvent(Long questionId, Long quizId, Instant occurredAt) {}
