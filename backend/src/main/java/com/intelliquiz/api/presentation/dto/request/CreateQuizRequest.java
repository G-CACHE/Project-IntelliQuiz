package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new quiz.
 */
@Schema(description = "Request body for creating a new quiz")
public record CreateQuizRequest(
    @Schema(description = "Title of the quiz", example = "Science Quiz 2024", maxLength = 200, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,
    
    @Schema(description = "Optional description of the quiz", example = "A quiz covering basic science concepts")
    String description
) {}
