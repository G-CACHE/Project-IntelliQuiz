package com.intelliquiz.api.quiz.internal.presentation.controllers;

import com.intelliquiz.api.quiz.internal.application.commands.CreateQuestionCommand;
import com.intelliquiz.api.quiz.internal.application.commands.UpdateQuestionCommand;
import com.intelliquiz.api.quiz.internal.application.services.QuestionManagementService;
import com.intelliquiz.api.quiz.internal.application.services.QuizManagementService;
import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.presentation.dto.request.CreateQuestionRequest;
import com.intelliquiz.api.quiz.internal.presentation.dto.request.ReorderQuestionsRequest;
import com.intelliquiz.api.quiz.internal.presentation.dto.request.UpdateQuestionRequest;
import com.intelliquiz.api.shared.dto.ErrorResponse;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.security.SecurityUtils;
import com.intelliquiz.api.quiz.internal.presentation.dto.response.QuestionResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for question management.
 * Requires authentication for all endpoints.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Questions", description = "Question management within quizzes. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class QuestionController {

    private final QuestionManagementService questionManagementService;
    private final QuizManagementService quizManagementService;

    public QuestionController(QuestionManagementService questionManagementService,
                              QuizManagementService quizManagementService) {
        this.questionManagementService = questionManagementService;
        this.quizManagementService = quizManagementService;
    }

    /**
     * Lists all questions for a quiz.
     */
    @GetMapping("/quizzes/{quizId}/questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    @Operation(
            summary = "List questions for a quiz",
            description = "Retrieves all questions belonging to a specific quiz, ordered by their position."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Questions retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = QuestionResponse.class)))
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
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        SystemRole role = SecurityUtils.extractRole(auth);
        quizManagementService.verifyQuizAccess(quizId, userId, role);
        List<Question> questions = questionManagementService.getQuestionsByQuiz(quizId);
        List<QuestionResponse> responses = questions.stream()
                .map(QuestionResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Adds a question to a quiz.
     */
    @PostMapping("/quizzes/{quizId}/questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    @Operation(
            summary = "Add a question to a quiz",
            description = "Creates a new question and adds it to the specified quiz."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Question created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuestionResponse.class))
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
    public ResponseEntity<QuestionResponse> addQuestion(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId,
            @Valid @RequestBody CreateQuestionRequest request,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        SystemRole role = SecurityUtils.extractRole(auth);
        quizManagementService.verifyQuizAccess(quizId, userId, role);
        CreateQuestionCommand command = new CreateQuestionCommand(
                request.text(),
                request.type(),
                request.difficulty(),
                request.correctKey(),
                request.caseSensitive(),
                request.points(),
                request.timeLimit(),
                request.options()
        );
        Question question = questionManagementService.addQuestion(quizId, command, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(QuestionResponse.from(question));
    }

    /**
     * Updates a question.
     */
    @PutMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    @Operation(
            summary = "Update a question",
            description = "Updates an existing question with the provided details."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Question updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuestionResponse.class))
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
                    description = "Question not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<QuestionResponse> updateQuestion(
            @Parameter(description = "Unique identifier of the question", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuestionRequest request) {
        UpdateQuestionCommand command = new UpdateQuestionCommand(
                request.text(),
                request.type(),
                request.difficulty(),
                request.correctKey(),
                request.caseSensitive(),
                request.points(),
                request.timeLimit(),
                request.options()
        );
        Question question = questionManagementService.updateQuestion(id, command);
        return ResponseEntity.ok(QuestionResponse.from(question));
    }

    /**
     * Deletes a question.
     */
    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    @Operation(
            summary = "Delete a question",
            description = "Deletes a question and all associated submissions."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Question deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Question not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> deleteQuestion(
            @Parameter(description = "Unique identifier of the question", required = true)
            @PathVariable Long id) {
        questionManagementService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reorders questions within a quiz.
     */
    @PutMapping("/quizzes/{quizId}/questions/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    @Operation(
            summary = "Reorder questions",
            description = "Reorders questions within a quiz based on the provided list of question IDs."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Questions reordered successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = QuestionResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body or question IDs",
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
    public ResponseEntity<List<QuestionResponse>> reorderQuestions(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId,
            @Valid @RequestBody ReorderQuestionsRequest request,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        SystemRole role = SecurityUtils.extractRole(auth);
        quizManagementService.verifyQuizAccess(quizId, userId, role);
        questionManagementService.reorderQuestions(quizId, request.questionIds());
        // Fetch the updated questions after reordering
        List<Question> questions = questionManagementService.getQuestionsByQuiz(quizId);
        List<QuestionResponse> responses = questions.stream()
                .map(QuestionResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
