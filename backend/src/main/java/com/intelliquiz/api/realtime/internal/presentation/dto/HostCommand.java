package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.intelliquiz.api.realtime.internal.domain.enums.HostCommandType;

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
