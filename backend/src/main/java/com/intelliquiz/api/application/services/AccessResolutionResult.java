package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;

/**
 * Result object for access code resolution.
 * Contains the route type and the resolved entity (Team or Quiz).
 */
public record AccessResolutionResult(
    RouteType routeType,
    Team team,
    Quiz quiz,
    String errorMessage
) {
    public static AccessResolutionResult participant(Team team) {
        return new AccessResolutionResult(RouteType.PARTICIPANT, team, null, null);
    }

    public static AccessResolutionResult host(Quiz quiz) {
        return new AccessResolutionResult(RouteType.HOST, null, quiz, null);
    }

    public static AccessResolutionResult invalid(String errorMessage) {
        return new AccessResolutionResult(RouteType.INVALID, null, null, errorMessage);
    }
}
