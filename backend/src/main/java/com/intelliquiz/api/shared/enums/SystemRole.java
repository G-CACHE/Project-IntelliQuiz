package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Defines the role hierarchy for system access levels.
 * SUPER_ADMIN > ADMIN > PROCTOR / PARTICIPANT
 */
@Schema(description = "System access levels: SUPER_ADMIN (full system access), ADMIN (quiz author), PROCTOR (session monitor), PARTICIPANT (player)")
public enum SystemRole {
    /**
     * Full system access, can manage all quizzes and users.
     * Only other SUPER_ADMIN can create SUPER_ADMIN users.
     */
    SUPER_ADMIN,

    /**
     * Quiz author — can create/edit quizzes, manage question bank.
     * Can only be created by SUPER_ADMIN users.
     */
    ADMIN,

    /**
     * Session monitor — can view live quiz sessions, track violations, kick participants.
     * Authenticates via proctor PIN.
     */
    PROCTOR,

    /**
     * Quiz participant — joins via team access code, answers questions.
     */
    PARTICIPANT
}
