package com.intelliquiz.api.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for registering a new team.
 */
@Schema(description = "Request body for registering a new team")
public record CreateTeamRequest(
    @Schema(description = "Name of the team", example = "Team Alpha", maxLength = 100, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Team name is required")
    @Size(max = 100, message = "Team name must not exceed 100 characters")
    String name
) {}
