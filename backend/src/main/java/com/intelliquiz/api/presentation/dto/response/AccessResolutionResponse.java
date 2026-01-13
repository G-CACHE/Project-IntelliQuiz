package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.application.services.RouteType;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for access code resolution.
 */
@Schema(description = "Response containing the result of access code resolution")
public record AccessResolutionResponse(
    @Schema(description = "Type of route determined by the access code (PARTICIPANT for team codes, HOST for proctor PINs, INVALID for unrecognized codes)", example = "PARTICIPANT")
    RouteType routeType,
    
    @Schema(description = "Team details when routeType is PARTICIPANT")
    TeamResponse team,
    
    @Schema(description = "Quiz details when routeType is HOST")
    QuizResponse quiz,
    
    @Schema(description = "Error message when routeType is INVALID", example = "Invalid access code")
    String errorMessage
) {
    /**
     * Creates a participant response with team details.
     */
    public static AccessResolutionResponse participant(TeamResponse team) {
        return new AccessResolutionResponse(RouteType.PARTICIPANT, team, null, null);
    }

    /**
     * Creates a host response with quiz details.
     */
    public static AccessResolutionResponse host(QuizResponse quiz) {
        return new AccessResolutionResponse(RouteType.HOST, null, quiz, null);
    }

    /**
     * Creates an invalid response with error message.
     */
    public static AccessResolutionResponse invalid(String errorMessage) {
        return new AccessResolutionResponse(RouteType.INVALID, null, null, errorMessage);
    }
}
