package com.intelliquiz.api.shared.exceptions;

/**
 * Thrown when a user attempts to perform an action they are not authorized to perform.
 */
public class AuthorizationException extends DomainException {

    public AuthorizationException(String message) {
        super(message);
    }
}
