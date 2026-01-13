package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Question format types.
 */
@Schema(description = "Question format types: MULTIPLE_CHOICE (predefined options), IDENTIFICATION (free-text answer)")
public enum QuestionType {
    /**
     * Question with predefined options stored in ElementCollection.
     */
    MULTIPLE_CHOICE,

    /**
     * Free-text answer question.
     */
    IDENTIFICATION
}
