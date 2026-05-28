package com.intelliquiz.api.user.dto;

import com.intelliquiz.api.shared.enums.SystemRole;

/**
 * DTO carrying user credentials for cross-module authentication.
 * Used by the auth module to verify passwords without accessing User entity directly.
 */
public record UserCredentialsDto(
    Long userId,
    String username,
    String passwordHash,
    SystemRole role,
    boolean superAdmin
) {}
