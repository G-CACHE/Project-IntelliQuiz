package com.intelliquiz.api.domain.exceptions;

/**
 * Thrown when authentication fails due to invalid credentials.
 * The message should be generic to avoid revealing which credential was incorrect.
 */
public class AuthenticationFailedException extends DomainException {

    public AuthenticationFailedException(String message) {
        super(message);
    }
}
