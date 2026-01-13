package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user authentication.
 */
@Schema(description = "Request body for user authentication")
public record LoginRequest(
    @Schema(description = "Username for authentication", example = "admin", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Username is required")
    String username,
    
    @Schema(description = "Password for authentication", example = "password123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Password is required")
    String password
) {}
