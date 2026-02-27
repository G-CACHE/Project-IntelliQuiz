package com.intelliquiz.api.auth.dto;

/**
 * Public DTO for authentication results.
 * Exposes only the token and role name — no internal entity leakage.
 */
public record AuthenticationResultDto(
    String token,
    String role
) {}
