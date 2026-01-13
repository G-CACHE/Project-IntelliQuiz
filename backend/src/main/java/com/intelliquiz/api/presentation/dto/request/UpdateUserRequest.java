package com.intelliquiz.api.presentation.dto.request;

import com.intelliquiz.api.domain.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing user.
 */
@Schema(description = "Request body for updating an existing user")
public record UpdateUserRequest(
    @Schema(description = "New username for the user", example = "updatedadmin", maxLength = 50)
    @Size(max = 50, message = "Username must not exceed 50 characters")
    String username,
    
    @Schema(description = "New password for the user (minimum 8 characters)", example = "newSecurePass456", minLength = 8)
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,
    
    @Schema(description = "New system role for the user (SUPER_ADMIN, ADMIN, PROCTOR)", example = "PROCTOR")
    SystemRole role
) {}
