package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for submitting an answer to a question.
 */
@Schema(description = "Request body for submitting an answer to a question")
public record SubmitAnswerRequest(
    @Schema(description = "ID of the team submitting the answer", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Team ID is required")
    Long teamId,
    
    @Schema(description = "ID of the question being answered", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Question ID is required")
    Long questionId,
    
    @Schema(description = "The submitted answer", example = "A", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Answer is required")
    String answer
) {}
