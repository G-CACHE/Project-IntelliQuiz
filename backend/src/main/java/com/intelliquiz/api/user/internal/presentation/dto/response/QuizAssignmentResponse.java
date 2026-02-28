package com.intelliquiz.api.user.internal.presentation.dto.response;

import com.intelliquiz.api.user.internal.domain.entities.QuizAssignment;
import com.intelliquiz.api.shared.enums.AdminPermission;
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
     * quizTitle must be resolved externally (via QuizFacade).
     */
    public static QuizAssignmentResponse from(QuizAssignment assignment, String quizTitle) {
        return new QuizAssignmentResponse(
            assignment.getId(),
            assignment.getQuizId(),
            quizTitle,
            assignment.getPermissions()
        );
    }

    /**
     * Creates a QuizAssignmentResponse from a QuizAssignment entity without title.
     */
    public static QuizAssignmentResponse from(QuizAssignment assignment) {
        return new QuizAssignmentResponse(
            assignment.getId(),
            assignment.getQuizId(),
            null,
            assignment.getPermissions()
        );
    }
}
