package com.intelliquiz.api.realtime.dto;

/**
 * Event published when a quiz session ends.
 */
public record QuizSessionEndedEvent(Long quizId) {}
