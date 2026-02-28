package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.QuestionType;

/**
 * Public DTO exposing question information to other modules (e.g., submission grading, realtime).
 */
public record QuestionInfoDto(Long id, String correctKey, int points,
                               QuestionType type, int timeLimit) {}
