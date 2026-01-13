package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Timer tick message for question countdown.
 */
public record TimerMessage(
        int remainingSeconds,
        int totalSeconds,
        boolean isActive
) {
    public static TimerMessage active(int remaining, int total) {
        return new TimerMessage(remaining, total, true);
    }
    
    public static TimerMessage expired(int total) {
        return new TimerMessage(0, total, false);
    }
    
    public static TimerMessage paused(int remaining, int total) {
        return new TimerMessage(remaining, total, false);
    }
}
