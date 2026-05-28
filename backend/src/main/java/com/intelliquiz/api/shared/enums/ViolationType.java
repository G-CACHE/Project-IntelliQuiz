package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Types of proctoring violations detected during a quiz session.
 */
@Schema(description = "Proctoring violation types detected during active quiz sessions")
public enum ViolationType {
    /**
     * Participant switched browser tabs or minimized the window.
     */
    TAB_SWITCH,

    /**
     * Participant attempted to copy text (Ctrl+C / Cmd+C).
     */
    COPY_ATTEMPT,

    /**
     * Participant attempted right-click context menu.
     */
    RIGHT_CLICK,

    /**
     * Participant attempted to take a screenshot (Print Screen).
     */
    PRINT_SCREEN
}
