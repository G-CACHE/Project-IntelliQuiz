package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.QuizStatus;

/**
 * Public DTO exposing read-only quiz information to other modules.
 */
public record QuizInfoDto(Long id, String title, QuizStatus status,
                           boolean isLive, String proctorPin) {}
