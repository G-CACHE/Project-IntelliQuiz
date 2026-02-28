package com.intelliquiz.api.team.internal.domain.valueobjects;

/**
 * Value object representing a team access code.
 * Validates format: 6 alphanumeric uppercase characters.
 */
public record AccessCode(String value) {

    public AccessCode {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Access code cannot be blank");
        }
        if (value.length() != 6) {
            throw new IllegalArgumentException("Access code must be exactly 6 characters");
        }
        if (!value.matches("[A-Z0-9]{6}")) {
            throw new IllegalArgumentException("Access code must contain only uppercase alphanumeric characters");
        }
    }
}
