package com.intelliquiz.api.quiz.internal.application.commands;

import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;

import java.util.List;

/**
 * Command object for creating a new question.
 */
public record CreateQuestionCommand(
    String text,
    QuestionType type,
    Difficulty difficulty,
    String correctKey,
    int points,
    int timeLimit,
    List<String> options
) {}
