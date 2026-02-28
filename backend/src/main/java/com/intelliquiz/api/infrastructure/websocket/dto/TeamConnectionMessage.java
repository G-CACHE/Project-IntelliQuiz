package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * WebSocket message for team connection/disconnection events.
 * Broadcast to all clients on the /topic/quiz/{quizId}/teams channel.
 */
public record TeamConnectionMessage(
        String type,      // "TEAM_CONNECTED" or "TEAM_DISCONNECTED"
        Long teamId,
        String teamName,  // null for disconnection
        String timestamp
) {}
