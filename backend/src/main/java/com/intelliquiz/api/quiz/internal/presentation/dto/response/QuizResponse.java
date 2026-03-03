package com.intelliquiz.api.quiz.internal.presentation.dto.response;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.shared.enums.QuizStatus;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for quiz details.
 */
@Schema(description = "Response containing quiz details")
public record QuizResponse(
    @Schema(description = "Unique identifier of the quiz", example = "1")
    Long id,
    
    @Schema(description = "Title of the quiz", example = "Science Quiz 2024")
    String title,
    
    @Schema(description = "Description of the quiz", example = "A quiz covering basic science concepts")
    String description,
    
    @Schema(description = "Proctor PIN for host access", example = "PIN123")
    String proctorPin,
    
    @Schema(description = "Whether the quiz has an active live session", example = "false")
    boolean isLiveSession,
    
    @Schema(description = "Current status of the quiz (DRAFT, READY, ACTIVE, ARCHIVED)", example = "READY")
    QuizStatus status,
    
    @Schema(description = "ID of the admin who created this quiz", example = "2")
    Long createdByUserId,
    
    @Schema(description = "Number of questions in the quiz", example = "10")
    int questionCount,
    
    @Schema(description = "Number of teams registered for the quiz", example = "5")
    int teamCount
) {
    /**
     * Creates a QuizResponse from a Quiz entity.
     */
    public static QuizResponse from(Quiz quiz) {
        return new QuizResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getProctorPin(),
            quiz.isLiveSession(),
            quiz.getStatus(),
            quiz.getCreatedByUserId(),
            quiz.getQuestions() != null ? quiz.getQuestions().size() : 0,
            0 // Team count resolved externally via TeamFacade after module extraction
        );
    }
}
