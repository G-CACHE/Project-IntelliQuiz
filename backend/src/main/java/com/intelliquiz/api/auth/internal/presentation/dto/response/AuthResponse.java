package com.intelliquiz.api.auth.internal.presentation.dto.response;

import com.intelliquiz.api.shared.enums.SystemRole;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for successful authentication.
 * Token is delivered via HttpOnly cookie — NOT in the response body.
 */
@Schema(description = "Response containing authentication result (token delivered via HttpOnly cookie)")
public record AuthResponse(
    @Schema(description = "Username of the authenticated user", example = "admin")
    String username,
    
    @Schema(description = "System role of the authenticated user (SUPER_ADMIN, ADMIN)", example = "ADMIN")
    SystemRole role
) {}
