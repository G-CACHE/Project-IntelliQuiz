package com.intelliquiz.api.realtime.internal.presentation.dto;

/**
 * WebSocket message from proctor to set auto-kick threshold.
 */
public record ThresholdMessage(
        int threshold
) {}
