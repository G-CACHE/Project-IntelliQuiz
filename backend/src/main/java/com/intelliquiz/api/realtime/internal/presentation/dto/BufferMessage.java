package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Buffer countdown message for "Get Ready" phase.
 */
public record BufferMessage(
        @JsonProperty("timeRemaining") int remainingSeconds,
        String roundName,
        String message
) {
    public static BufferMessage create(int remainingSeconds, String roundName) {
        String message = remainingSeconds > 0 
                ? "GET READY FOR " + roundName.toUpperCase() + "!"
                : "Starting...";
        return new BufferMessage(remainingSeconds, roundName, message);
    }
}
