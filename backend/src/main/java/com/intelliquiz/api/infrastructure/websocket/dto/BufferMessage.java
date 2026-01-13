package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Buffer countdown message for "Get Ready" phase.
 */
public record BufferMessage(
        int remainingSeconds,
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
