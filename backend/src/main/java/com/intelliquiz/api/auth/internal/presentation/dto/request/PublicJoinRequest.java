package com.intelliquiz.api.auth.internal.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for joining a public quiz with participant/team display name.
 */
@Schema(description = "Request body for joining a public quiz")
public record PublicJoinRequest(
        @Schema(description = "Participant/team name", example = "Team Phoenix", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        @Schema(description = "Browser device UUID for sticky rejoin", example = "550e8400-e29b-41d4-a716-446655440000")
        @Size(max = 128, message = "Device ID must not exceed 128 characters")
        String deviceId
) {
        public PublicJoinRequest(String name) {
                this(name, null);
        }
}
