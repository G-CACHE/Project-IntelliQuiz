package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Timer tick message for question countdown.
 */
public record TimerMessage(
        @JsonProperty("timeRemaining") int remainingSeconds,
        @JsonProperty("totalTime") int totalSeconds,
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
