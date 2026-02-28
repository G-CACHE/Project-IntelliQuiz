package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.user.UserFacade;
import com.intelliquiz.api.user.dto.UserCredentialsDto;
import com.intelliquiz.api.shared.domain.ports.PasswordHashingService;
import org.springframework.stereotype.Service;

/**
 * Application service for user authentication.
 * Uses UserFacade for credential lookup — no direct access to User entity/repository.
 */
@Service
public class AuthenticationService {

    private static final String GENERIC_AUTH_ERROR = "Invalid username or password";

    private final UserFacade userFacade;
    private final PasswordHashingService passwordHashingService;

    public AuthenticationService(UserFacade userFacade,
                                  PasswordHashingService passwordHashingService) {
        this.userFacade = userFacade;
        this.passwordHashingService = passwordHashingService;
    }

    /**
     * Authenticates a user with username and password.
     */
    public AuthenticationResult authenticate(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return AuthenticationResult.failure(GENERIC_AUTH_ERROR);
        }

        return userFacade.findCredentials(username)
                .map(creds -> verifyPassword(creds, password))
                .orElse(AuthenticationResult.failure(GENERIC_AUTH_ERROR));
    }

    private AuthenticationResult verifyPassword(UserCredentialsDto creds, String password) {
        if (passwordHashingService.matches(password, creds.passwordHash())) {
            return AuthenticationResult.success(creds.userId(), creds.username(), creds.role());
        }
        return AuthenticationResult.failure(GENERIC_AUTH_ERROR);
    }
}
