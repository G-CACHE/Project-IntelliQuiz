package com.intelliquiz.api.quiz.internal.presentation.dto.response;

import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for a Question Bank item.
 */
@Schema(description = "Response containing a Question Bank item")
public record QuestionBankItemResponse(
    @Schema(description = "Unique identifier of the bank item", example = "1")
    Long id,

    @Schema(description = "ID of the admin who owns this bank item", example = "10")
    Long ownerUserId,

    @Schema(description = "The question text", example = "What is the capital of France?")
    String text,

    @Schema(description = "Type of question (MULTIPLE_CHOICE, TRUE_FALSE, IDENTIFICATION)", example = "MULTIPLE_CHOICE")
    QuestionType type,

    @Schema(description = "Difficulty level (EASY, MEDIUM, HARD)", example = "MEDIUM")
    Difficulty difficulty,

    @Schema(description = "The correct answer key", example = "A")
    String correctKey,

    @Schema(description = "Points awarded for correct answer", example = "10")
    int points,

    @Schema(description = "Time limit in seconds", example = "30")
    int timeLimit,

    @Schema(description = "List of answer options", example = "[\"Paris\", \"London\", \"Berlin\", \"Madrid\"]")
    List<String> options,

    @Schema(description = "Quiz ID where this question was originally created", example = "5")
    Long sourceQuizId,

    @Schema(description = "Title of the quiz where this question was originally created", example = "My Quiz")
    String sourceQuizTitle,

    @Schema(description = "Original question ID from the source quiz", example = "42")
    Long sourceQuestionId,

    @Schema(description = "When this bank item was created")
    Instant createdAt
) {
    public static QuestionBankItemResponse from(QuestionBankItem item) {
        return new QuestionBankItemResponse(
            item.getId(),
            item.getOwnerUserId(),
            item.getText(),
            item.getType(),
            item.getDifficulty(),
            item.getCorrectKey(),
            item.getPoints(),
            item.getTimeLimit(),
            item.getOptions(),
            item.getSourceQuizId(),
            item.getSourceQuizTitle(),
            item.getSourceQuestionId(),
            item.getCreatedAt()
        );
    }
}
