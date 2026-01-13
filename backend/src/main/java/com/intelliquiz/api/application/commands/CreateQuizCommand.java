package com.intelliquiz.api.application.commands;

/**
 * Command object for creating a new quiz.
 */
public record CreateQuizCommand(
    String title,
    String description
) {}
