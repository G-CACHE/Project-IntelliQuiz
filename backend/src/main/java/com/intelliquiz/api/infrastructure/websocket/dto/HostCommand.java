package com.intelliquiz.api.infrastructure.websocket.dto;

import com.intelliquiz.api.infrastructure.websocket.HostCommandType;

import java.util.Map;

/**
 * Command message from host to control quiz flow.
 */
public record HostCommand(
        HostCommandType type,
        Map<String, Object> payload
) {
    public HostCommand(HostCommandType type) {
        this(type, Map.of());
    }
}
