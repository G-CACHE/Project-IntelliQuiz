package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.ports.PasswordHashingService;
import com.intelliquiz.api.domain.ports.UserRepository;
import org.springframework.stereotype.Service;

/**
 * Application service for user authentication.
 * Handles login verification with secure password comparison.
 */
@Service
public class AuthenticationService {

    // Generic error message to avoid revealing which credential was incorrect
    private static final String GENERIC_AUTH_ERROR = "Invalid username or password";

    private final UserRepository userRepository;
    private final PasswordHashingService passwordHashingService;

    public AuthenticationService(UserRepository userRepository, 
                                  PasswordHashingService passwordHashingService) {
        this.userRepository = userRepository;
        this.passwordHashingService = passwordHashingService;
    }

    /**
     * Authenticates a user with username and password.
     * Returns a generic error message for security (doesn't reveal which credential was wrong).
     * 
     * @param username the username to authenticate
     * @param password the plain text password to verify
     * @return AuthenticationResult with success status and user or error message
     */
    public AuthenticationResult authenticate(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return AuthenticationResult.failure(GENERIC_AUTH_ERROR);
        }

        return userRepository.findByUsername(username)
                .map(user -> verifyPassword(user, password))
                .orElse(AuthenticationResult.failure(GENERIC_AUTH_ERROR));
    }

    private AuthenticationResult verifyPassword(User user, String password) {
        if (passwordHashingService.matches(password, user.getPassword())) {
            return AuthenticationResult.success(user);
        }
        return AuthenticationResult.failure(GENERIC_AUTH_ERROR);
    }
}
