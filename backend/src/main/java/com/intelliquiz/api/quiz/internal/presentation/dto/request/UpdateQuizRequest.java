package com.intelliquiz.api.quiz.internal.presentation.dto.request;

import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing quiz.
 */
@Schema(description = "Request body for updating an existing quiz")
public record UpdateQuizRequest(
    @Schema(description = "New title for the quiz", example = "Updated Science Quiz", maxLength = 200)
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,
    
    @Schema(description = "New description for the quiz", example = "An updated quiz covering advanced science concepts")
    String description,

    @Schema(description = "Participant entry mode", example = "PUBLIC", allowableValues = {"PUBLIC", "RESTRICTED"})
    QuizAccessMode accessMode,
    
    @Schema(description = "Navigation mode for the quiz (TOURNAMENT or CLASS)", example = "TOURNAMENT", allowableValues = {"TOURNAMENT", "CLASS"})
    NavigationMode navigationMode,
    
    @Schema(description = "Global time limit for the entire quiz in seconds (0 = no limit)", example = "3600")
    @Min(value = 0, message = "Global time limit must be non-negative")
    Integer globalTimeLimitSeconds,

    @Schema(description = "Randomize question order per participant (for CLASS mode)", example = "false")
    Boolean randomizeQuestions
) {}
