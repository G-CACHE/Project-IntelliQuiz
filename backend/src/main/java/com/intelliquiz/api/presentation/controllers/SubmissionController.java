package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.services.SubmissionService;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.presentation.dto.request.SubmitAnswerRequest;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.SubmissionResponse;
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
 * REST controller for answer submissions.
 * Requires authentication for all endpoints.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Submissions", description = "Answer submission and grading. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * Submits an answer to a question.
     * Returns the grading result (correct/incorrect, points awarded).
     */
    @PostMapping("/submissions")
    @Operation(
            summary = "Submit an answer",
            description = "Submits an answer to a question and returns the grading result including whether the answer was correct and points awarded."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Answer submitted and graded successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SubmissionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body or duplicate submission",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Team or question not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SubmissionResponse> submitAnswer(
            @Valid @RequestBody SubmitAnswerRequest request) {
        Submission submission = submissionService.submitAnswer(
                request.teamId(),
                request.questionId(),
                request.answer()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(SubmissionResponse.from(submission));
    }

    /**
     * Gets all submissions for a team.
     */
    @GetMapping("/teams/{teamId}/submissions")
    @Operation(
            summary = "Get team submissions",
            description = "Retrieves all answer submissions for a specific team."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Submissions retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = SubmissionResponse.class)))
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
    public ResponseEntity<List<SubmissionResponse>> getTeamSubmissions(
            @Parameter(description = "Unique identifier of the team", required = true)
            @PathVariable Long teamId) {
        List<Submission> submissions = submissionService.getSubmissionsByTeam(teamId);
        List<SubmissionResponse> responses = submissions.stream()
                .map(SubmissionResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
