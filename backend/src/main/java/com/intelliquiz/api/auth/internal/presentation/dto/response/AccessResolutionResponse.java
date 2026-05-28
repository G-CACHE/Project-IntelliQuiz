package com.intelliquiz.api.auth.internal.presentation.dto.response;

import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.RouteType;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for access code resolution.
 * Uses nested team/quiz objects to match frontend AccessResolutionResponse contract.
 */
@Schema(description = "Response containing the result of access code resolution")
public record AccessResolutionResponse(
    @Schema(description = "Type of route determined by the access code", example = "PARTICIPANT")
    RouteType routeType,

    @Schema(description = "Team info when routeType is PARTICIPANT")
    TeamResponse team,

    @Schema(description = "Quiz info when routeType is PARTICIPANT or HOST")
    QuizAccessResponse quiz,

    @Schema(description = "Error message when routeType is INVALID", example = "Invalid access code")
    String errorMessage
) {
    /**
     * Nested team info returned for PARTICIPANT routes.
     */
    @Schema(description = "Team information for participant access")
    public record TeamResponse(
        Long id,
        String name,
        String accessCode,
        int totalScore,
        Long quizId
    ) {}

    /**
     * Nested quiz info returned for HOST and PARTICIPANT routes.
     */
    @Schema(description = "Quiz information for host/participant access")
    public record QuizAccessResponse(
        Long id,
        String title,
        String quizCode,
        String proctorPin,
        boolean isLive,
        QuizStatus status,
        QuizAccessMode accessMode
    ) {}

    /**
     * Creates a participant response with nested team and quiz objects.
     */
    public static AccessResolutionResponse participant(TeamResponse team, QuizAccessResponse quiz) {
        return new AccessResolutionResponse(RouteType.PARTICIPANT, team, quiz, null);
    }

    /**
     * Creates a host response with nested quiz object.
     */
    public static AccessResolutionResponse host(QuizAccessResponse quiz) {
        return new AccessResolutionResponse(RouteType.HOST, null, quiz, null);
    }

    /**
     * Creates an invalid response with error message.
     */
    public static AccessResolutionResponse invalid(String errorMessage) {
        return new AccessResolutionResponse(RouteType.INVALID, null, null, errorMessage);
    }
}
