package com.intelliquiz.api.quiz.internal.presentation.dto.response;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
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

    @Schema(description = "Participant-facing quiz code", example = "A7K9M2")
    String quizCode,
    
    @Schema(description = "Proctor PIN for host access", example = "PIN123")
    String proctorPin,
    
    @Schema(description = "Whether the quiz has an active live session", example = "false")
    boolean isLiveSession,
    
    @Schema(description = "Current status of the quiz (DRAFT, READY, ACTIVE, ARCHIVED)", example = "READY")
    QuizStatus status,
    
    @Schema(description = "ID of the admin who created this quiz", example = "2")
    Long createdByUserId,

    @Schema(description = "Participant entry mode (PUBLIC or RESTRICTED)", example = "RESTRICTED")
    QuizAccessMode accessMode,
    
    @Schema(description = "Number of questions in the quiz", example = "10")
    int questionCount,
    
    @Schema(description = "Number of teams registered for the quiz", example = "5")
    int teamCount,
    
    @Schema(description = "Navigation mode for the quiz (TOURNAMENT or CLASS)", example = "TOURNAMENT", allowableValues = {"TOURNAMENT", "CLASS"})
    NavigationMode navigationMode,
    
    @Schema(description = "Global time limit for the entire quiz in seconds (0 = no limit)", example = "3600")
    int globalTimeLimitSeconds,

    @Schema(description = "Randomize question order per participant (for CLASS mode)", example = "false")
    boolean randomizeQuestions
) {
    private static int resolveQuestionCount(Quiz quiz) {
        try {
            return quiz.getQuestions() != null ? quiz.getQuestions().size() : 0;
        } catch (Exception ignored) {
            // Keep response serialization safe when lazy collections are not initialized.
            return 0;
        }
    }

    /**
     * Creates a QuizResponse from a Quiz entity.
     */
    public static QuizResponse from(Quiz quiz) {
        return new QuizResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getQuizCode(),
            quiz.getProctorPin(),
            quiz.isLiveSession(),
            quiz.getStatus(),
            quiz.getCreatedByUserId(),
            quiz.getAccessMode(),
            resolveQuestionCount(quiz),
            0, // Team count resolved externally via TeamFacade after module extraction
            quiz.getNavigationMode(),
            quiz.getGlobalTimeLimitSeconds(),
            quiz.isRandomizeQuestions()
        );
    }
}
