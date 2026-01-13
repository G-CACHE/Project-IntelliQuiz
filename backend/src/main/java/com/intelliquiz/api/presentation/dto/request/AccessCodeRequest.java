package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for access code resolution.
 */
@Schema(description = "Request body for resolving an access code")
public record AccessCodeRequest(
    @Schema(description = "Access code to resolve (team code or proctor PIN)", example = "ABC123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Access code is required")
    String code
) {}
