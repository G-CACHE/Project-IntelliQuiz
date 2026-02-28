package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.shared.enums.RouteType;

/**
 * Result object for access code resolution.
 * Uses IDs instead of entities — no cross-module internal access.
 */
public record AccessResolutionResult(
    RouteType routeType,
    Long teamId,
    Long quizId,
    String errorMessage
) {
    public static AccessResolutionResult participant(Long teamId, Long quizId) {
        return new AccessResolutionResult(RouteType.PARTICIPANT, teamId, quizId, null);
    }

    public static AccessResolutionResult host(Long quizId) {
        return new AccessResolutionResult(RouteType.HOST, null, quizId, null);
    }

    public static AccessResolutionResult invalid(String errorMessage) {
        return new AccessResolutionResult(RouteType.INVALID, null, null, errorMessage);
    }
}
