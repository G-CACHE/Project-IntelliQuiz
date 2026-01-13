package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Granular quiz-level permissions for admin users.
 */
@Schema(description = "Quiz-level permissions: CAN_VIEW_DETAILS (read-only), CAN_EDIT_CONTENT (manage questions), CAN_MANAGE_TEAMS (register teams), CAN_HOST_GAME (live session controls)")
public enum AdminPermission {
    /**
     * Read-only access to quiz configuration.
     */
    CAN_VIEW_DETAILS,

    /**
     * Create/update/delete questions.
     */
    CAN_EDIT_CONTENT,

    /**
     * Register teams, generate access codes.
     */
    CAN_MANAGE_TEAMS,

    /**
     * Access live session controls and proctor PIN.
     */
    CAN_HOST_GAME
}
