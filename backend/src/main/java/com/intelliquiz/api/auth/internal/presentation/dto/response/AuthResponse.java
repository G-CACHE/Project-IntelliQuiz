package com.intelliquiz.api.auth.internal.presentation.dto.response;

import com.intelliquiz.api.shared.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for successful authentication.
 * JWT is delivered exclusively via HttpOnly cookie (SameSite=Lax).
 */
@Schema(description = "Response containing authentication result")
public record AuthResponse(
    @Schema(description = "Username of the authenticated user", example = "admin")
    String username,
    
    @Schema(description = "System role of the authenticated user (SUPER_ADMIN, ADMIN)", example = "ADMIN")
    SystemRole role
) {}
