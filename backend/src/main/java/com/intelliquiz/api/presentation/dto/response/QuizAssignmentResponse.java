package com.intelliquiz.api.presentation.dto.response;

import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.enums.AdminPermission;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Response DTO for quiz assignment details.
 */
@Schema(description = "Response containing quiz assignment details")
public record QuizAssignmentResponse(
    @Schema(description = "Unique identifier of the assignment", example = "1")
    Long id,
    
    @Schema(description = "User ID", example = "1")
    Long userId,
    
    @Schema(description = "Username of the assigned user", example = "admin")
    String username,
    
    @Schema(description = "Quiz ID", example = "1")
    Long quizId,
    
    @Schema(description = "Title of the assigned quiz", example = "Math Quiz")
    String quizTitle,
    
    @Schema(description = "Set of permissions granted", example = "[\"CAN_VIEW_DETAILS\", \"CAN_EDIT_CONTENT\"]")
    Set<String> permissions
) {
    /**
     * Creates a QuizAssignmentResponse from a QuizAssignment entity.
     */
    public static QuizAssignmentResponse from(QuizAssignment assignment) {
        return new QuizAssignmentResponse(
            assignment.getId(),
            assignment.getUser().getId(),
            assignment.getUser().getUsername(),
            assignment.getQuiz().getId(),
            assignment.getQuiz().getTitle(),
            assignment.getPermissions().stream()
                .map(AdminPermission::name)
                .collect(Collectors.toSet())
        );
    }
}
