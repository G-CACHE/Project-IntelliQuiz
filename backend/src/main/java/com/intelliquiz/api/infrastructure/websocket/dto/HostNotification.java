package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Notification message sent only to the host.
 */
public record HostNotification(
        String type,
        Object payload
) {
    // Notification types
    public static final String TEAM_JOINED = "TEAM_JOINED";
    public static final String TEAM_DISCONNECTED = "TEAM_DISCONNECTED";
    public static final String TEAM_SUBMITTED = "TEAM_SUBMITTED";
    public static final String ALL_SUBMITTED = "ALL_SUBMITTED";
    public static final String TIE_DETECTED = "TIE_DETECTED";
    public static final String HOST_RECONNECTED = "HOST_RECONNECTED";
    
    public static HostNotification teamJoined(TeamInfo teamInfo) {
        return new HostNotification(TEAM_JOINED, teamInfo);
    }
    
    public static HostNotification teamDisconnected(Long teamId) {
        return new HostNotification(TEAM_DISCONNECTED, teamId);
    }
    
    public static HostNotification teamSubmitted(Long teamId) {
        return new HostNotification(TEAM_SUBMITTED, teamId);
    }
    
    public static HostNotification allSubmitted(int teamCount) {
        return new HostNotification(ALL_SUBMITTED, teamCount);
    }
    
    public static HostNotification tieDetected(Object tieInfo) {
        return new HostNotification(TIE_DETECTED, tieInfo);
    }
}
