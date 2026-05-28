package com.intelliquiz.api.shared.enums;

/**
 * Determines how participants are admitted into a quiz.
 */
public enum QuizAccessMode {
    /**
     * Public entry: participants can join directly.
     */
    PUBLIC,

    /**
     * Restricted entry: pre-registered teams are required.
     */
    RESTRICTED
}
