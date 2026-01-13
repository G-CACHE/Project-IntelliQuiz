package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.Team;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for team details.
 */
@Schema(description = "Response containing team details")
public record TeamResponse(
    @Schema(description = "Unique identifier of the team", example = "1")
    Long id,
    
    @Schema(description = "Name of the team", example = "Team Alpha")
    String name,
    
    @Schema(description = "Access code for the team to join the quiz", example = "ABC123")
    String accessCode,
    
    @Schema(description = "Total score accumulated by the team", example = "150")
    int totalScore,
    
    @Schema(description = "ID of the quiz the team is registered for", example = "1")
    Long quizId
) {
    /**
     * Creates a TeamResponse from a Team entity.
     */
    public static TeamResponse from(Team team) {
        return new TeamResponse(
            team.getId(),
            team.getName(),
            team.getAccessCode(),
            team.getTotalScore(),
            team.getQuiz() != null ? team.getQuiz().getId() : null
        );
    }
}
