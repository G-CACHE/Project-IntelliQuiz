package com.intelliquiz.api.shared.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Defines the assessment navigation mode for a quiz session.
 */
@Schema(description = "Assessment navigation mode: TOURNAMENT (proctor-controlled, per-question timer), CLASS (participant-controlled, global timer)")
public enum NavigationMode {
    /**
     * Tournament Mode — per-question timers, proctor-controlled navigation.
     * Proctor controls question advancement. Participants cannot navigate.
     */
    TOURNAMENT,

    /**
     * Class Mode — global quiz timer, participant-controlled navigation.
     * Participants control next/previous navigation. Questions can be randomized.
     */
    CLASS
}
