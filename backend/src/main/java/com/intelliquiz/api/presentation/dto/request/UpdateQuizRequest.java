package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing quiz.
 */
@Schema(description = "Request body for updating an existing quiz")
public record UpdateQuizRequest(
    @Schema(description = "New title for the quiz", example = "Updated Science Quiz", maxLength = 200)
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,
    
    @Schema(description = "New description for the quiz", example = "An updated quiz covering advanced science concepts")
    String description
) {}
