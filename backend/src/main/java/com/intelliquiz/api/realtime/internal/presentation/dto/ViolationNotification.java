package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.intelliquiz.api.shared.enums.ViolationType;

/**
 * WebSocket message broadcast to proctor when a violation is detected.
 */
public record ViolationNotification(
        Long teamId,
        String teamName,
        int totalCount,
        ViolationType lastType,
        boolean autoKicked
) {
    public static ViolationNotification create(Long teamId, String teamName, int count, ViolationType type, boolean kicked) {
        return new ViolationNotification(teamId, teamName, count, type, kicked);
    }
}
