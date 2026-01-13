package com.intelliquiz.api.presentation.dto.request;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

import java.util.List;

/**
 * Request DTO for updating an existing question.
 */
@Schema(description = "Request body for updating an existing question")
public record UpdateQuestionRequest(
    @Schema(description = "Updated question text", example = "What is the capital of Germany?")
    String text,
    
    @Schema(description = "Updated question type (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)", example = "MULTIPLE_CHOICE")
    QuestionType type,
    
    @Schema(description = "Updated difficulty level (EASY, MEDIUM, HARD)", example = "HARD")
    Difficulty difficulty,
    
    @Schema(description = "Updated correct answer key", example = "B")
    String correctKey,
    
    @Schema(description = "Updated points for correct answer", example = "15", minimum = "0")
    @Min(value = 0, message = "Points must be non-negative")
    Integer points,
    
    @Schema(description = "Updated time limit in seconds", example = "45", minimum = "0")
    @Min(value = 0, message = "Time limit must be non-negative")
    Integer timeLimit,
    
    @Schema(description = "Updated list of answer options", example = "[\"Berlin\", \"Munich\", \"Hamburg\", \"Frankfurt\"]")
    List<String> options
) {}
