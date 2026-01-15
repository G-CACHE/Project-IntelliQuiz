package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.enums.AdminPermission;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;

/**
 * Response DTO for quiz assignment details.
 */
@Schema(description = "Response containing quiz assignment details for a user")
public record QuizAssignmentResponse(
    @Schema(description = "Unique identifier of the assignment", example = "1")
    Long id,
    
    @Schema(description = "Unique identifier of the assigned quiz", example = "10")
    Long quizId,
    
    @Schema(description = "Title of the assigned quiz", example = "Science Quiz 2024")
    String quizTitle,
    
    @Schema(description = "Set of permissions granted to the user for this quiz")
    Set<AdminPermission> permissions
) {
    /**
     * Creates a QuizAssignmentResponse from a QuizAssignment entity.
     */
    public static QuizAssignmentResponse from(QuizAssignment assignment) {
        return new QuizAssignmentResponse(
            assignment.getId(),
            assignment.getQuiz().getId(),
            assignment.getQuiz().getTitle(),
            assignment.getPermissions()
        );
    }
}
