package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Quiz lifecycle states.
 */
@Schema(description = "Quiz lifecycle states: DRAFT (under construction), READY (can be activated), ARCHIVED (completed, read-only)")
public enum QuizStatus {
    /**
     * Quiz under construction, not visible to participants.
     */
    DRAFT,

    /**
     * Quiz prepared, can be activated for live session.
     */
    READY,

    /**
     * Quiz completed, read-only historical record.
     */
    ARCHIVED
}
