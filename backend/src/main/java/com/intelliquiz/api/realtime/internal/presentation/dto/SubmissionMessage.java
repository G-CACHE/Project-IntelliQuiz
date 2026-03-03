package com.intelliquiz.api.realtime.internal.presentation.dto;

/**
 * Answer submission message from participant.
 */
public record SubmissionMessage(
        Long questionId,
        String answer
) {}
