package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Response DTO for question details.
 */
@Schema(description = "Response containing question details")
public record QuestionResponse(
    @Schema(description = "Unique identifier of the question", example = "1")
    Long id,
    
    @Schema(description = "The question text", example = "What is the capital of France?")
    String text,
    
    @Schema(description = "Type of question (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)", example = "MULTIPLE_CHOICE")
    QuestionType type,
    
    @Schema(description = "Difficulty level (EASY, MEDIUM, HARD)", example = "MEDIUM")
    Difficulty difficulty,
    
    @Schema(description = "The correct answer key", example = "A")
    String correctKey,
    
    @Schema(description = "Points awarded for correct answer", example = "10")
    int points,
    
    @Schema(description = "Time limit in seconds", example = "30")
    int timeLimit,
    
    @Schema(description = "Position of the question in the quiz", example = "1")
    int orderIndex,
    
    @Schema(description = "List of answer options for multiple choice questions", example = "[\"Paris\", \"London\", \"Berlin\", \"Madrid\"]")
    List<String> options
) {
    /**
     * Creates a QuestionResponse from a Question entity.
     */
    public static QuestionResponse from(Question question) {
        return new QuestionResponse(
            question.getId(),
            question.getText(),
            question.getType(),
            question.getDifficulty(),
            question.getCorrectKey(),
            question.getPoints(),
            question.getTimeLimit(),
            question.getOrderIndex(),
            question.getOptions()
        );
    }
}
