package com.intelliquiz.api.realtime.dto;

/**
 * Event published when a quiz session is activated (game starts).
 */
public record QuizSessionActivatedEvent(Long quizId) {}
