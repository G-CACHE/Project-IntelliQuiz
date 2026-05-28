package com.intelliquiz.api.quiz.internal.domain.valueobjects;

import java.util.Objects;

/**
 * Value object encapsulating quiz live session state.
 * Immutable snapshot of session configuration.
 */
public record QuizSession(boolean isLive, String accessCode, String proctorPin) {
    public QuizSession {
        Objects.requireNonNull(proctorPin, "Proctor PIN required");
    }
}
