package com.intelliquiz.api.shared.exceptions;

/**
 * Thrown when a quiz state transition is invalid (e.g., transitioning to READY without questions).
 */
public class InvalidQuizStateException extends DomainException {

    public InvalidQuizStateException(String message) {
        super(message);
    }
}
