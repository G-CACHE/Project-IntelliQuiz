package com.intelliquiz.api.user.internal.presentation.dto.request;

import com.intelliquiz.api.shared.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new admin user.
 * Only EXAMINER role is allowed. SUPER_ADMIN users can only be created during system initialization.
 */
@Schema(description = "Request body for creating a new admin user. Only EXAMINER role can be assigned.")
public record CreateUserRequest(
    @Schema(description = "Username for the new user", example = "newadmin", maxLength = 50, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Username is required")
    @Size(max = 50, message = "Username must not exceed 50 characters")
    String username,
    
    @Schema(description = "Password for the new user (minimum 8 characters)", example = "securePass123", minLength = 8, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,
    
    @Schema(description = "System role for the user. Only EXAMINER is allowed. SUPER_ADMIN can only be created during system initialization.", example = "EXAMINER", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Role is required")
    SystemRole role
) {}
