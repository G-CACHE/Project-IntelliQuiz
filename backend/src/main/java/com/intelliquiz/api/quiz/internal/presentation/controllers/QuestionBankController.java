package com.intelliquiz.api.quiz.internal.presentation.controllers;

import com.intelliquiz.api.quiz.internal.application.services.QuestionBankService;
import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.quiz.internal.presentation.dto.request.AttachFromBankRequest;
import com.intelliquiz.api.quiz.internal.presentation.dto.response.QuestionBankItemResponse;
import com.intelliquiz.api.quiz.internal.presentation.dto.response.QuestionResponse;
import com.intelliquiz.api.shared.dto.ErrorResponse;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.security.SecurityUtils;
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
 * REST controller for the Admin Question Bank.
 * All endpoints require ADMIN or SUPER_ADMIN role.
 */
@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
@Tag(name = "Question Bank", description = "Personal question bank management for admins. Requires JWT authentication.")
@SecurityRequirement(name = "bearerAuth")
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    public QuestionBankController(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
    }

    /**
     * Lists the current user's Question Bank items with optional filters.
     */
    @GetMapping("/question-bank")
    @Operation(
            summary = "List question bank items",
            description = "Retrieves the current admin's question bank items. Supports filtering by type, difficulty, and keyword search."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Bank items retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = QuestionBankItemResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<List<QuestionBankItemResponse>> getBankItems(
            @Parameter(description = "Filter by question type") @RequestParam(required = false) QuestionType type,
            @Parameter(description = "Filter by difficulty level") @RequestParam(required = false) Difficulty difficulty,
            @Parameter(description = "Search by keyword in question text") @RequestParam(required = false) String search,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        List<QuestionBankItem> items = questionBankService.getBankItems(userId, type, difficulty, search);
        List<QuestionBankItemResponse> responses = items.stream()
                .map(QuestionBankItemResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Gets a specific Question Bank item by ID (owner only).
     */
    @GetMapping("/question-bank/{id}")
    @Operation(
            summary = "Get a question bank item",
            description = "Retrieves a specific question bank item. Only the owner can access their own items."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Bank item retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuestionBankItemResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - not the owner of this bank item",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Bank item not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<QuestionBankItemResponse> getBankItem(
            @Parameter(description = "Unique identifier of the bank item", required = true)
            @PathVariable Long id,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        QuestionBankItem item = questionBankService.getBankItem(id, userId);
        return ResponseEntity.ok(QuestionBankItemResponse.from(item));
    }

    /**
     * Deletes a Question Bank item (owner only).
     */
    @DeleteMapping("/question-bank/{id}")
    @Operation(
            summary = "Delete a question bank item",
            description = "Removes a question bank item. Only the owner can delete their own items. " +
                          "This does not affect any quiz questions that were created from this bank item."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Bank item deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - not the owner of this bank item",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Bank item not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> deleteBankItem(
            @Parameter(description = "Unique identifier of the bank item", required = true)
            @PathVariable Long id,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        questionBankService.deleteBankItem(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Copies a Question Bank item into a quiz as a new question.
     * Verifies both bank item ownership and quiz ownership.
     */
    @PostMapping("/quizzes/{quizId}/questions/from-bank")
    @Operation(
            summary = "Add question from bank to quiz",
            description = "Copies a question bank item into a quiz as a new question. " +
                          "Requires ownership of both the bank item and the quiz (SUPER_ADMIN bypasses quiz ownership)."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Question created from bank item successfully",
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
                    responseCode = "403",
                    description = "Forbidden - not the owner of the bank item or quiz",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Bank item or quiz not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<QuestionResponse> attachFromBank(
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId,
            @Valid @RequestBody AttachFromBankRequest request,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        SystemRole role = SecurityUtils.extractRole(auth);
        Question question = questionBankService.attachToQuiz(request.bankItemId(), quizId, userId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(QuestionResponse.from(question));
    }

    // ==================== Harvest & Import (Game Workflow) ====================

    /**
     * Harvests all instant questions from a completed quiz into the examiner's bank.
     */
    @PostMapping("/quizzes/{quizId}/harvest")
    @Operation(
            summary = "Harvest quiz questions into bank",
            description = "Copies all questions from a completed quiz into the examiner's personal question bank. " +
                          "Skips questions that already exist in the bank."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Questions harvested successfully"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    public ResponseEntity<List<QuestionBankItemResponse>> harvestQuestions(
            @PathVariable Long quizId,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        List<QuestionBankItem> harvested = questionBankService.harvestInstantQuestions(quizId, userId);
        List<QuestionBankItemResponse> responses = harvested.stream()
                .map(QuestionBankItemResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Imports multiple bank items into a quiz as new questions (batch).
     */
    @PostMapping("/quizzes/{quizId}/questions/import-from-bank")
    @Operation(
            summary = "Batch import from bank to quiz",
            description = "Copies multiple question bank items into a quiz. " +
                          "Requires ownership of all bank items and the quiz."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Questions imported successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - ownership check failed"),
            @ApiResponse(responseCode = "404", description = "Quiz or bank items not found")
    })
    public ResponseEntity<List<QuestionResponse>> importFromBank(
            @PathVariable Long quizId,
            @RequestBody List<Long> bankItemIds,
            Authentication auth) {
        Long userId = SecurityUtils.extractUserId(auth);
        SystemRole role = SecurityUtils.extractRole(auth);
        List<Question> questions = questionBankService.importFromBank(bankItemIds, quizId, userId, role);
        List<QuestionResponse> responses = questions.stream()
                .map(QuestionResponse::from)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }
}
