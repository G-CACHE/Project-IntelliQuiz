package com.intelliquiz.api.infrastructure.websocket.dto;

import com.intelliquiz.api.domain.entities.Team;

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
    public static TeamInfo connected(Team team, Instant connectedAt) {
        return new TeamInfo(team.getId(), team.getName(), connectedAt, true);
    }
    
    public static TeamInfo disconnected(Long teamId, String teamName) {
        return new TeamInfo(teamId, teamName, null, false);
    }
}
