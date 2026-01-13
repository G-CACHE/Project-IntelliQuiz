package com.intelliquiz.api.domain.exceptions;

/**
 * Thrown when an access code does not match any known team code or proctor PIN.
 */
public class InvalidAccessCodeException extends DomainException {

    public InvalidAccessCodeException(String message) {
        super(message);
    }
}
