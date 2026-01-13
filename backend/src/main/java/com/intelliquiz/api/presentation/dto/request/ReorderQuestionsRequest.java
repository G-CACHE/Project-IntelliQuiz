package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request DTO for reordering questions within a quiz.
 */
@Schema(description = "Request body for reordering questions within a quiz")
public record ReorderQuestionsRequest(
    @Schema(description = "Ordered list of question IDs representing the new order", example = "[3, 1, 2, 5, 4]", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "Question IDs list cannot be empty")
    List<Long> questionIds
) {}
