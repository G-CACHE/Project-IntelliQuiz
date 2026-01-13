package com.intelliquiz.api.application.commands;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;

import java.util.List;

/**
 * Command object for updating an existing question.
 */
public record UpdateQuestionCommand(
    String text,
    QuestionType type,
    Difficulty difficulty,
    String correctKey,
    int points,
    int timeLimit,
    List<String> options
) {}
