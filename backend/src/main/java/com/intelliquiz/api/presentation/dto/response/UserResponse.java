package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for user details.
 */
@Schema(description = "Response containing user details")
public record UserResponse(
    @Schema(description = "Unique identifier of the user", example = "1")
    Long id,
    
    @Schema(description = "Username of the user", example = "admin")
    String username,
    
    @Schema(description = "System role of the user (SUPER_ADMIN, ADMIN, PROCTOR)", example = "ADMIN")
    SystemRole role
) {
    /**
     * Creates a UserResponse from a User entity.
     */
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getSystemRole()
        );
    }
}
