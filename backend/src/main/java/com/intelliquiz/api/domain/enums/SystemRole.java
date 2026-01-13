package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Defines the two-tier admin hierarchy for system access levels.
 */
@Schema(description = "System access levels: SUPER_ADMIN (full system access), ADMIN (restricted, requires quiz-specific permissions)")
public enum SystemRole {
    /**
     * Full system access, can manage all quizzes and users.
     */
    SUPER_ADMIN,

    /**
     * Restricted access, requires QuizAssignment for quiz-specific permissions.
     */
    ADMIN
}
