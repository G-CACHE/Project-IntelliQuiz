package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Quiz lifecycle states.
 */
@Schema(description = "Quiz lifecycle states: DRAFT (under construction), READY (prepared for launch), ACTIVE (session in progress), ARCHIVED (completed, read-only)")
public enum QuizStatus {
    /** Quiz under construction, not visible to participants. */
    DRAFT,

    /** Quiz prepared and ready to be launched by a proctor. */
    READY,

    /** Quiz session is currently active and being proctored. */
    ACTIVE,

    /** Quiz completed, read-only historical record. */
    ARCHIVED
}
