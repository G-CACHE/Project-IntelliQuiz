package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Question format types.
 */
@Schema(description = "Question format types: MULTIPLE_CHOICE (predefined options), TRUE_FALSE (binary choice), IDENTIFICATION (free-text answer)")
public enum QuestionType {
    /**
     * Question with predefined options stored in ElementCollection.
     */
    MULTIPLE_CHOICE,

    /**
     * Binary question with True/False options.
     */
    TRUE_FALSE,

    /**
     * Free-text answer question.
     */
    IDENTIFICATION
}
