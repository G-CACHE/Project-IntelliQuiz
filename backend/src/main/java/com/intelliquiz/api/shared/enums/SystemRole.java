package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Defines the role hierarchy for system access levels.
 * SUPER_ADMIN > EXAMINER > PROCTOR / PARTICIPANT
 */
@Schema(description = "System access levels: SUPER_ADMIN (full system access), EXAMINER (quiz author), PROCTOR (session monitor), PARTICIPANT (player)")
public enum SystemRole {
    /**
     * Full system access, can manage all quizzes and users.
     */
    SUPER_ADMIN,

    /**
     * Quiz author — can create/edit quizzes, manage question bank.
     * Formerly known as ADMIN.
     */
    EXAMINER,

    /**
     * Restricted access, requires QuizAssignment for quiz-specific permissions.
     * @deprecated Use {@link #EXAMINER} instead. Kept for backward compatibility.
     */
    @Deprecated
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
