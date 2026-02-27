package com.intelliquiz.api.auth;

import com.intelliquiz.api.auth.dto.AccessResolutionResultDto;
import com.intelliquiz.api.auth.dto.AuthenticationResultDto;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
import com.intelliquiz.api.auth.internal.application.services.AuthorizationService;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.shared.enums.AdminPermission;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Public facade for the auth module.
 * All cross-module access to authentication, authorization, and access-resolution
 * should go through this facade.
 */
@Service
public class AuthFacade {

    private final AuthenticationService authenticationService;
    private final AuthorizationService authorizationService;
    private final AccessResolutionService accessResolutionService;

    public AuthFacade(AuthenticationService authenticationService,
                      AuthorizationService authorizationService,
                      AccessResolutionService accessResolutionService) {
        this.authenticationService = authenticationService;
        this.authorizationService = authorizationService;
        this.accessResolutionService = accessResolutionService;
    }

    // ── Authentication ───────────────────────────────────────────────

    /**
     * Authenticate user credentials.
     *
     * @param username the username
     * @param password the raw password
     * @return authentication result containing success flag, user, and error message
     */
    public AuthenticationResult authenticate(String username, String password) {
        return authenticationService.authenticate(username, password);
    }

    // ── Authorization ────────────────────────────────────────────────

    /**
     * Check if a user has access to a specific quiz.
     * Throws {@code AuthorizationException} if access is denied.
     */
    public void checkQuizAccess(User user, Quiz quiz) {
        authorizationService.checkQuizAccess(user, quiz);
    }

    /**
     * Check if a user has a specific permission for a quiz.
     * Throws {@code AuthorizationException} if not permitted.
     */
    public void checkPermission(User user, Quiz quiz, AdminPermission permission) {
        authorizationService.checkPermission(user, quiz, permission);
    }

    /**
     * Get all quizzes accessible to a user.
     */
    public List<Quiz> getAccessibleQuizzes(User user) {
        return authorizationService.getAccessibleQuizzes(user);
    }

    /**
     * Require super-admin privileges.
     * Throws {@code AuthorizationException} if not a super admin.
     */
    public void requireSuperAdmin(User user) {
        authorizationService.requireSuperAdmin(user);
    }

    // ── Access Resolution ────────────────────────────────────────────

    /**
     * Resolve an access code to determine the route type (participant/host/invalid).
     */
    public AccessResolutionResult resolveAccessCode(String accessCode) {
        return accessResolutionService.resolve(accessCode);
    }
}
