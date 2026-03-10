package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Defines the assessment navigation mode for a quiz session.
 */
@Schema(description = "Assessment navigation mode: LINEAR (strict per-question timer, forward-only), NON_LINEAR (global timer, free navigation)")
public enum NavigationMode {
    /**
     * Strict Progression — per-question timers, forward-only navigation.
     * Host-controlled question advancement. Participants cannot go back.
     */
    LINEAR,

    /**
     * Participant-Controlled — global timer, free navigation between questions.
     * Participants can answer in any order and revisit questions.
     */
    NON_LINEAR
}
