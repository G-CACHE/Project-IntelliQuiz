package com.intelliquiz.api.auth.dto;

/**
 * Public DTO for access code resolution results.
 * Exposes only IDs and names — no internal entity leakage.
 */
public record AccessResolutionResultDto(
    Long quizId,
    Long teamId,
    String teamName
) {}
