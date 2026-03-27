package com.intelliquiz.api.quiz.internal.application.commands;

import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;

/**
 * Command object for creating a new quiz.
 */
public record CreateQuizCommand(
    String title,
    String description,
    Long createdByUserId,
    QuizAccessMode accessMode,
    NavigationMode navigationMode,
    Integer globalTimeLimitSeconds,
    Boolean randomizeQuestions
) {}
