package com.intelliquiz.api.realtime.internal.presentation.dto;

import java.time.Instant;

/**
 * Team connection information for host monitoring.
 */
public record TeamInfo(
        Long teamId,
        String teamName,
        Instant connectedAt,
        boolean isConnected
) {
    public static TeamInfo connected(Long teamId, String teamName, Instant connectedAt) {
        return new TeamInfo(teamId, teamName, connectedAt, true);
    }
    
    public static TeamInfo disconnected(Long teamId, String teamName) {
        return new TeamInfo(teamId, teamName, null, false);
    }
}
