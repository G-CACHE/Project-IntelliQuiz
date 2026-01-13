package com.intelliquiz.api.presentation.dto.request;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request DTO for creating a new question.
 */
@Schema(description = "Request body for creating a new question")
public record CreateQuestionRequest(
    @Schema(description = "The question text to display", example = "What is the capital of France?", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Question text is required")
    String text,
    
    @Schema(description = "Type of question (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)", example = "MULTIPLE_CHOICE", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Question type is required")
    QuestionType type,
    
    @Schema(description = "Difficulty level of the question (EASY, MEDIUM, HARD)", example = "MEDIUM", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Difficulty is required")
    Difficulty difficulty,
    
    @Schema(description = "The correct answer key (option letter for multiple choice, or answer text)", example = "A", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Correct answer key is required")
    String correctKey,
    
    @Schema(description = "Points awarded for correct answer", example = "10", minimum = "0", requiredMode = Schema.RequiredMode.REQUIRED)
    @Min(value = 0, message = "Points must be non-negative")
    int points,
    
    @Schema(description = "Time limit in seconds for answering", example = "30", minimum = "0", requiredMode = Schema.RequiredMode.REQUIRED)
    @Min(value = 0, message = "Time limit must be non-negative")
    int timeLimit,
    
    @Schema(description = "List of answer options for multiple choice questions", example = "[\"Paris\", \"London\", \"Berlin\", \"Madrid\"]")
    List<String> options
) {}
