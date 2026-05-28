package com.intelliquiz.api.quiz.internal.application.commands;

import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;

/**
 * Command object for updating an existing quiz.
 */
public record UpdateQuizCommand(
    String title,
    String description,
    QuizAccessMode accessMode,
    NavigationMode navigationMode,
    Integer globalTimeLimitSeconds,
    Boolean randomizeQuestions
) {}
