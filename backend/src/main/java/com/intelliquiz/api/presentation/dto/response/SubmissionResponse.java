package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.Submission;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Response DTO for submission details.
 */
@Schema(description = "Response containing submission details and grading result")
public record SubmissionResponse(
    @Schema(description = "Unique identifier of the submission", example = "1")
    Long id,
    
    @Schema(description = "ID of the team that submitted the answer", example = "1")
    Long teamId,
    
    @Schema(description = "ID of the question that was answered", example = "5")
    Long questionId,
    
    @Schema(description = "The answer submitted by the team", example = "A")
    String submittedAnswer,
    
    @Schema(description = "Whether the submitted answer was correct", example = "true")
    boolean isCorrect,
    
    @Schema(description = "Points awarded for this submission", example = "10")
    int awardedPoints,
    
    @Schema(description = "Timestamp when the answer was submitted", example = "2024-01-15T10:30:00")
    LocalDateTime submittedAt
) {
    /**
     * Creates a SubmissionResponse from a Submission entity.
     */
    public static SubmissionResponse from(Submission submission) {
        return new SubmissionResponse(
            submission.getId(),
            submission.getTeam() != null ? submission.getTeam().getId() : null,
            submission.getQuestion() != null ? submission.getQuestion().getId() : null,
            submission.getSubmittedAnswer(),
            submission.isCorrect(),
            submission.getAwardedPoints(),
            submission.getSubmittedAt()
        );
    }
}
