package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.services.TeamRegistrationService;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.presentation.dto.request.CreateTeamRequest;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.TeamResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for team management.
 * Requires authentication for all endpoints.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Teams", description = "Team registration and management. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class TeamController {

    private final TeamRegistrationService teamRegistrationService;

    public TeamController(TeamRegistrationService teamRegistrationService) {
        this.teamRegistrationService = teamRegistrationService;
    }

    /**
     * Lists all teams for a quiz.
     */
    @GetMapping("/quizzes/{quizId}/teams")
    @Operation(
            summary = "List teams for a quiz",
            description = "Retrieves all teams registered for a specific quiz."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Teams retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = TeamResponse.class)))
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
    public ResponseEntity<List<TeamResponse>> getTeams(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId) {
        List<Team> teams = teamRegistrationService.getTeamsByQuiz(quizId);
        List<TeamResponse> responses = teams.stream()
                .map(TeamResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Registers a new team for a quiz.
     * Returns the team with generated access code.
     */
    @PostMapping("/quizzes/{quizId}/teams")
    @Operation(
            summary = "Register a team",
            description = "Registers a new team for a quiz and generates a unique access code for the team."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Team registered successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TeamResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
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
    public ResponseEntity<TeamResponse> registerTeam(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId,
            @Valid @RequestBody CreateTeamRequest request) {
        Team team = teamRegistrationService.registerTeam(quizId, request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(TeamResponse.from(team));
    }

    /**
     * Removes a team.
     */
    @DeleteMapping("/teams/{id}")
    @Operation(
            summary = "Remove a team",
            description = "Removes a team and all associated submissions."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Team removed successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Team not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> removeTeam(
            @Parameter(description = "Unique identifier of the team", required = true)
            @PathVariable Long id) {
        teamRegistrationService.removeTeam(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Resets all team scores for a quiz to zero.
     */
    @PostMapping("/quizzes/{quizId}/teams/reset-scores")
    @Operation(
            summary = "Reset team scores",
            description = "Resets all team scores for a quiz to zero."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Team scores reset successfully"
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
    public ResponseEntity<Void> resetTeamScores(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId) {
        teamRegistrationService.resetTeamScores(quizId);
        return ResponseEntity.ok().build();
    }
}
