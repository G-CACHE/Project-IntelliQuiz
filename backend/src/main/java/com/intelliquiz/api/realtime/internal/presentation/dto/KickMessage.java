package com.intelliquiz.api.realtime.internal.presentation.dto;

/**
 * WebSocket message broadcast when a participant is kicked from the session.
 */
public record KickMessage(
        Long teamId,
        String teamName,
        String reason
) {
    public static KickMessage autoKick(Long teamId, String teamName, int violationCount) {
        return new KickMessage(teamId, teamName, "Auto-kicked after " + violationCount + " violations.");
    }

    public static KickMessage manualKick(Long teamId, String teamName) {
        return new KickMessage(teamId, teamName, "Removed by proctor.");
    }
}
