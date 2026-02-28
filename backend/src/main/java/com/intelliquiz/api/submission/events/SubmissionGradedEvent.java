package com.intelliquiz.api.submission.events;

/**
 * Published when a submission is graded.
 */
public record SubmissionGradedEvent(
        Long submissionId,
        Long teamId,
        Long questionId,
        boolean isCorrect,
        int awardedPoints
) {}
