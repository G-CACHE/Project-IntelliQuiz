package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for successful authentication.
 */
@Schema(description = "Response containing authentication result with JWT token")
public record AuthResponse(
    @Schema(description = "JWT token for authenticating subsequent API requests", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    String token,
    
    @Schema(description = "Username of the authenticated user", example = "admin")
    String username,
    
    @Schema(description = "System role of the authenticated user (SUPER_ADMIN, ADMIN, PROCTOR)", example = "ADMIN")
    SystemRole role
) {}
