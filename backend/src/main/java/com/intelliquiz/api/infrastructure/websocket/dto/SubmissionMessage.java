package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Answer submission message from participant.
 */
public record SubmissionMessage(
        Long questionId,
        String answer
) {}
