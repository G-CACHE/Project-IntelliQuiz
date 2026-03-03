package com.intelliquiz.api.submission.dto;

import java.time.LocalDateTime;

/**
 * Read-only submission data exposed to other modules via the SubmissionFacade.
 */
public record SubmissionInfoDto(
        Long id,
        Long teamId,
        Long questionId,
        String submittedAnswer,
        boolean isCorrect,
        int awardedPoints,
        LocalDateTime submittedAt,
        boolean isGraded
) {}
