package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.shared.enums.SystemRole;

/**
 * Result object for authentication operations.
 * Uses ID + role info instead of User entity to avoid cross-module internal access.
 */
public record AuthenticationResult(
    boolean success,
    Long userId,
    String username,
    SystemRole role,
    String errorMessage
) {
    public static AuthenticationResult success(Long userId, String username, SystemRole role) {
        return new AuthenticationResult(true, userId, username, role, null);
    }

    public static AuthenticationResult failure(String errorMessage) {
        return new AuthenticationResult(false, null, null, null, errorMessage);
    }
}
