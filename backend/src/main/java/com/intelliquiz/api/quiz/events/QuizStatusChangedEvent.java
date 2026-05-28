package com.intelliquiz.api.quiz.events;

import com.intelliquiz.api.shared.enums.QuizStatus;

import java.time.Instant;

/**
 * Event published when a quiz transitions between statuses.
 */
public record QuizStatusChangedEvent(Long quizId, QuizStatus oldStatus,
                                      QuizStatus newStatus, Instant occurredAt) {}
