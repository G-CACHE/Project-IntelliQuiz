package com.intelliquiz.api.domain.exceptions;

/**
 * Thrown when attempting to activate a quiz that is not in READY status.
 */
public class QuizNotReadyException extends DomainException {

    public QuizNotReadyException(String message) {
        super(message);
    }
}
