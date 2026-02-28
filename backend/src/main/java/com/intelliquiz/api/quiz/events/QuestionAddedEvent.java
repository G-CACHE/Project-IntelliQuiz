package com.intelliquiz.api.quiz.events;

import java.time.Instant;

/**
 * Event published when a question is added to a quiz.
 */
public record QuestionAddedEvent(Long questionId, Long quizId, Instant occurredAt) {}
