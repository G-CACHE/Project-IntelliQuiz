package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.commands.CreateQuizCommand;
import com.intelliquiz.api.application.commands.UpdateQuizCommand;
import com.intelliquiz.api.application.services.QuizManagementService;
import com.intelliquiz.api.application.services.QuizSessionService;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.presentation.dto.request.CreateQuizRequest;
import com.intelliquiz.api.presentation.dto.request.UpdateQuizRequest;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.QuizResponse;
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
import java.util.Optional;

/**
 * REST controller for quiz management and session control.
 * Requires authentication for all endpoints.
 */
@RestController
@RequestMapping("/api/quizzes")
@Tag(name = "Quizzes", description = "Quiz CRUD operations and session management. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class QuizController {

    private final QuizManagementService quizManagementService;
    private final QuizSessionService quizSessionService;

    public QuizController(QuizManagementService quizManagementService,
                          QuizSessionService quizSessionService) {
        this.quizManagementService = quizManagementService;
        this.quizSessionService = quizSessionService;
    }

    /**
     * Lists all quizzes.
     */
    @GetMapping
    @Operation(
            summary = "List all quizzes",
            description = "Retrieves a list of all quizzes in the system."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quizzes retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = QuizResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<List<QuizResponse>> getAllQuizzes() {
        List<Quiz> quizzes = quizManagementService.getAllQuizzes();
        List<QuizResponse> responses = quizzes.stream()
                .map(QuizResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Gets a quiz by ID.
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get quiz by ID",
            description = "Retrieves a specific quiz by its unique identifier."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
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
    public ResponseEntity<QuizResponse> getQuiz(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        Quiz quiz = quizManagementService.getQuiz(id);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Creates a new quiz.
     */
    @PostMapping
    @Operation(
            summary = "Create a new quiz",
            description = "Creates a new quiz with the provided title and description. The quiz is created in DRAFT status."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Quiz created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
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
            )
    })
    public ResponseEntity<QuizResponse> createQuiz(@Valid @RequestBody CreateQuizRequest request) {
        CreateQuizCommand command = new CreateQuizCommand(request.title(), request.description());
        Quiz quiz = quizManagementService.createQuiz(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(QuizResponse.from(quiz));
    }

    /**
     * Updates an existing quiz.
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "Update a quiz",
            description = "Updates an existing quiz with the provided title and description."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
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
    public ResponseEntity<QuizResponse> updateQuiz(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuizRequest request) {
        UpdateQuizCommand command = new UpdateQuizCommand(request.title(), request.description());
        Quiz quiz = quizManagementService.updateQuiz(id, command);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Deletes a quiz.
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a quiz",
            description = "Deletes a quiz and all associated questions, teams, and submissions."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Quiz deleted successfully"
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
    public ResponseEntity<Void> deleteQuiz(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        quizManagementService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Transitions a quiz to READY status.
     */
    @PostMapping("/{id}/ready")
    @Operation(
            summary = "Transition quiz to READY status",
            description = "Transitions a quiz from DRAFT to READY status, making it available for activation."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz transitioned to READY successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid state transition",
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
    public ResponseEntity<QuizResponse> transitionToReady(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        Quiz quiz = quizManagementService.transitionToReady(id);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Archives a quiz.
     */
    @PostMapping("/{id}/archive")
    @Operation(
            summary = "Archive a quiz",
            description = "Archives a quiz, making it read-only and preserving historical data."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz archived successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid state transition",
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
    public ResponseEntity<QuizResponse> archiveQuiz(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        Quiz quiz = quizManagementService.archiveQuiz(id);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Activates a quiz session.
     */
    @PostMapping("/{id}/activate")
    @Operation(
            summary = "Activate quiz session",
            description = "Activates a quiz session, allowing teams to submit answers. Only one quiz can be active at a time."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz session activated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid state transition or another quiz is already active",
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
    public ResponseEntity<QuizResponse> activateSession(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        Quiz quiz = quizSessionService.activateSession(id);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Deactivates a quiz session.
     */
    @PostMapping("/{id}/deactivate")
    @Operation(
            summary = "Deactivate quiz session",
            description = "Deactivates an active quiz session, stopping answer submissions."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Quiz session deactivated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid state transition",
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
    public ResponseEntity<QuizResponse> deactivateSession(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long id) {
        Quiz quiz = quizSessionService.deactivateSession(id);
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }

    /**
     * Gets the currently active quiz session.
     */
    @GetMapping("/active")
    @Operation(
            summary = "Get active quiz session",
            description = "Retrieves the currently active quiz session, if any."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Active quiz session retrieved",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "204",
                    description = "No active quiz session"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<QuizResponse> getActiveSession() {
        Optional<Quiz> activeQuiz = quizSessionService.getActiveSession();
        return activeQuiz
                .map(quiz -> ResponseEntity.ok(QuizResponse.from(quiz)))
                .orElse(ResponseEntity.noContent().build());
    }
}
