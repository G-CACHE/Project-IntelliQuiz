package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.User;

/**
 * Result object for authentication operations.
 */
public record AuthenticationResult(
    boolean success,
    User user,
    String errorMessage
) {
    public static AuthenticationResult success(User user) {
        return new AuthenticationResult(true, user, null);
    }

    public static AuthenticationResult failure(String errorMessage) {
        return new AuthenticationResult(false, null, errorMessage);
    }
}
