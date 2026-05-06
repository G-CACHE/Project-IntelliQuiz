package com.intelliquiz.api.auth.internal.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a team's name with access code verification.
 */
@Schema(description = "Request body for updating team name")
public record UpdateTeamNameRequest(
    @Schema(description = "New name for the team (can include avatar encoding)", example = "Team Alpha|avatar-1.png", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @Schema(description = "Access code of the team for verification", example = "ABC123", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Access code is required")
    String accessCode
) {
}
