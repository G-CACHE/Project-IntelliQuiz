package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Question difficulty levels affecting point values.
 */
@Schema(description = "Question difficulty levels: EASY (simple), MEDIUM (moderate), HARD (challenging), TIE_BREAKER (for resolving ties)")
public enum Difficulty {
    /**
     * Simple questions.
     */
    EASY,

    /**
     * Moderate difficulty.
     */
    MEDIUM,

    /**
     * Challenging questions.
     */
    HARD,

    /**
     * Special questions for resolving tied scores.
     */
    TIE_BREAKER
}
