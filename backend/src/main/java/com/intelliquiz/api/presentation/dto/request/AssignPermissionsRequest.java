package com.intelliquiz.api.presentation.dto.request;

import com.intelliquiz.api.domain.enums.AdminPermission;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

/**
 * Request DTO for assigning quiz permissions to a user.
 */
@Schema(description = "Request body for assigning quiz permissions to a user")
public record AssignPermissionsRequest(
    @Schema(description = "ID of the quiz to assign permissions for", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Quiz ID is required")
    Long quizId,
    
    @Schema(description = "Set of permissions to assign (MANAGE_QUIZ, MANAGE_QUESTIONS, MANAGE_TEAMS, VIEW_SCOREBOARD, PROCTOR_SESSION)", example = "[\"MANAGE_QUIZ\", \"VIEW_SCOREBOARD\"]", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "At least one permission is required")
    Set<AdminPermission> permissions
) {}
