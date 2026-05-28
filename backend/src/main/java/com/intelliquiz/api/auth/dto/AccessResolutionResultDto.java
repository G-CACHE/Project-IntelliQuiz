package com.intelliquiz.api.auth.dto;

import com.intelliquiz.api.shared.enums.RouteType;

/**
 * Public DTO for access code resolution results.
 * Exposes only IDs, route type, and error — no internal entity leakage.
 */
public record AccessResolutionResultDto(
    RouteType routeType,
    Long quizId,
    Long teamId,
    String errorMessage
) {}
