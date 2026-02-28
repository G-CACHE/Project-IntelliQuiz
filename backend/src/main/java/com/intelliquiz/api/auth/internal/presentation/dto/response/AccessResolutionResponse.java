package com.intelliquiz.api.auth.internal.presentation.dto.response;

import com.intelliquiz.api.shared.enums.RouteType;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for access code resolution.
 * Uses IDs and basic info — no cross-module internal type references.
 */
@Schema(description = "Response containing the result of access code resolution")
public record AccessResolutionResponse(
    @Schema(description = "Type of route determined by the access code", example = "PARTICIPANT")
    RouteType routeType,
    
    @Schema(description = "Team ID when routeType is PARTICIPANT")
    Long teamId,
    
    @Schema(description = "Team name when routeType is PARTICIPANT")
    String teamName,
    
    @Schema(description = "Quiz ID when routeType is PARTICIPANT or HOST")
    Long quizId,
    
    @Schema(description = "Quiz title when routeType is HOST")
    String quizTitle,
    
    @Schema(description = "Error message when routeType is INVALID", example = "Invalid access code")
    String errorMessage
) {
    /**
     * Creates a participant response with team and quiz IDs.
     */
    public static AccessResolutionResponse participant(Long teamId, String teamName, Long quizId) {
        return new AccessResolutionResponse(RouteType.PARTICIPANT, teamId, teamName, quizId, null, null);
    }

    /**
     * Creates a host response with quiz ID and title.
     */
    public static AccessResolutionResponse host(Long quizId, String quizTitle) {
        return new AccessResolutionResponse(RouteType.HOST, null, null, quizId, quizTitle, null);
    }

    /**
     * Creates an invalid response with error message.
     */
    public static AccessResolutionResponse invalid(String errorMessage) {
        return new AccessResolutionResponse(RouteType.INVALID, null, null, null, null, errorMessage);
    }
}
