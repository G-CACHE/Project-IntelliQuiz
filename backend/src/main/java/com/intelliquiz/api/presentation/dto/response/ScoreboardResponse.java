package com.intelliquiz.api.presentation.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Response DTO for scoreboard data.
 */
@Schema(description = "Response containing scoreboard data with team rankings")
public record ScoreboardResponse(
    @Schema(description = "ID of the quiz this scoreboard belongs to", example = "1")
    Long quizId,
    
    @Schema(description = "List of scoreboard entries sorted by rank")
    List<ScoreboardEntry> entries
) {
    /**
     * Represents a single entry in the scoreboard.
     */
    @Schema(description = "A single entry in the scoreboard representing a team's ranking")
    public record ScoreboardEntry(
        @Schema(description = "Rank position (1-based, ties share the same rank)", example = "1")
        int rank,
        
        @Schema(description = "Name of the team", example = "Team Alpha")
        String teamName,
        
        @Schema(description = "Total score of the team", example = "150")
        int score,
        
        @Schema(description = "Unique identifier of the team", example = "1")
        Long teamId
    ) {}
}
