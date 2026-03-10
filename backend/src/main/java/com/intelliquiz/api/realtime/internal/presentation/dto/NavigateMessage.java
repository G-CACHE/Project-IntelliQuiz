package com.intelliquiz.api.realtime.internal.presentation.dto;

/**
 * WebSocket message from participant to navigate to a specific question (NON_LINEAR mode).
 */
public record NavigateMessage(
        int questionIndex
) {}
