package com.intelliquiz.api.submission.events;

/**
 * Published when a team submits an answer (before grading).
 */
public record AnswerSubmittedEvent(
        Long submissionId,
        Long teamId,
        Long questionId,
        String submittedAnswer
) {}
