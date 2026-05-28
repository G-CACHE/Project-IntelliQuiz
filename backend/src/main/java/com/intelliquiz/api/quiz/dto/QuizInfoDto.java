package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.enums.QuizAccessMode;

/**
 * Public DTO exposing read-only quiz information to other modules.
 */
public record QuizInfoDto(Long id, String title, QuizStatus status,
                           boolean isLive, String proctorPin, QuizAccessMode accessMode,
                           String quizCode, NavigationMode navigationMode,
                           int globalTimeLimitSeconds) {}
