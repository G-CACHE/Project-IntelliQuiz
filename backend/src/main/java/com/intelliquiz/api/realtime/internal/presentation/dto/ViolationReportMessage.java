package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.intelliquiz.api.shared.enums.ViolationType;

/**
 * WebSocket message from participant reporting a proctoring violation.
 */
public record ViolationReportMessage(
        ViolationType type
) {}
