package com.intelliquiz.api.quiz.internal.application.commands;

/**
 * Command object for updating an existing quiz.
 */
public record UpdateQuizCommand(
    String title,
    String description
) {}
