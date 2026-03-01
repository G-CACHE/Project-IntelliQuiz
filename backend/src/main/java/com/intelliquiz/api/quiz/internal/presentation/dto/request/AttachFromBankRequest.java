package com.intelliquiz.api.quiz.internal.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for attaching a Question Bank item to a quiz.
 */
@Schema(description = "Request body for copying a Question Bank item into a quiz as a new question")
public record AttachFromBankRequest(
    @Schema(description = "ID of the Question Bank item to copy into the quiz", example = "42", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Bank item ID is required")
    Long bankItemId
) {}
