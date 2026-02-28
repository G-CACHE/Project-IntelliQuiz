package com.intelliquiz.api.quiz.internal.application.commands;

/**
 * Command object for creating a new quiz.
 */
public record CreateQuizCommand(
    String title,
    String description
) {}
