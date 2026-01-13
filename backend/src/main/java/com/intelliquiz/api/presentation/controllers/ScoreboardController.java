package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.services.ScoreboardService;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.ScoreboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for scoreboard operations.
 * Requires authentication for all endpoints.
 */
@RestController
@RequestMapping("/api/quizzes/{quizId}/scoreboard")
@Tag(name = "Scoreboard", description = "Quiz scoreboard and rankings. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class ScoreboardController {

    private final ScoreboardService scoreboardService;

    public ScoreboardController(ScoreboardService scoreboardService) {
        this.scoreboardService = scoreboardService;
    }

    /**
     * Gets the scoreboard for a quiz with rankings.
     * Teams are sorted by score descending, with ties handled by same rank.
     */
    @GetMapping
    @Operation(
            summary = "Get quiz scoreboard",
            description = "Retrieves the scoreboard for a quiz with team rankings. Teams are sorted by score in descending order, with ties receiving the same rank."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Scoreboard retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScoreboardResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Quiz not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<ScoreboardResponse> getScoreboard(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId) {
        List<ScoreboardService.ScoreboardEntry> entries = scoreboardService.getScoreboard(quizId);
        
        List<ScoreboardResponse.ScoreboardEntry> responseEntries = entries.stream()
                .map(entry -> new ScoreboardResponse.ScoreboardEntry(
                        entry.rank(),
                        entry.teamName(),
                        entry.score(),
                        entry.teamId()
                ))
                .toList();
        
        ScoreboardResponse response = new ScoreboardResponse(quizId, responseEntries);
        return ResponseEntity.ok(response);
    }
}
