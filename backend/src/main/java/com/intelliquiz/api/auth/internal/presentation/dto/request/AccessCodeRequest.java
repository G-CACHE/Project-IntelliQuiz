package com.intelliquiz.api.auth.internal.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for access code resolution.
 */
@Schema(description = "Request body for resolving an access code")
public record AccessCodeRequest(
    @Schema(description = "Access code to resolve (team code or proctor PIN)", example = "ABC123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Access code is required")
    String code,

    @Schema(description = "Browser device UUID for sticky rejoin in public quizzes", example = "550e8400-e29b-41d4-a716-446655440000")
    @Size(max = 128, message = "Device ID must not exceed 128 characters")
    String deviceId
) {
    public AccessCodeRequest(String code) {
        this(code, null);
    }
}
