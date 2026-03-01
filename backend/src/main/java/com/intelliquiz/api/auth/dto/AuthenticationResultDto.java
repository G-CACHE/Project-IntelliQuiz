package com.intelliquiz.api.auth.dto;

/**
 * Public DTO for authentication results.
 * Exposes userId, username, and role — no token (token is HttpOnly cookie).
 */
public record AuthenticationResultDto(
    Long userId,
    String username,
    String role
) {}
