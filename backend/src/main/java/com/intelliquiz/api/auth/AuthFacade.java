package com.intelliquiz.api.auth;

import com.intelliquiz.api.auth.dto.AccessResolutionResultDto;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
import com.intelliquiz.api.auth.internal.application.services.AuthorizationService;
import com.intelliquiz.api.shared.enums.AdminPermission;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Public facade for the auth module.
 * All cross-module access to authentication, authorization, and access-resolution
 * should go through this facade. Uses IDs instead of entities to prevent
 * cross-module internal access violations.
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
     */
    public AuthenticationResult authenticate(String username, String password) {
        return authenticationService.authenticate(username, password);
    }

    // ── Authorization ────────────────────────────────────────────────

    /**
     * Check if a user has access to a specific quiz.
     * Throws {@code AuthorizationException} if access is denied.
     */
    public void checkQuizAccess(Long userId, Long quizId) {
        authorizationService.checkQuizAccess(userId, quizId);
    }

    /**
     * Check if a user has a specific permission for a quiz.
     * Throws {@code AuthorizationException} if not permitted.
     */
    public void checkPermission(Long userId, Long quizId, AdminPermission permission) {
        authorizationService.checkPermission(userId, quizId, permission);
    }

    /**
     * Get all quiz IDs accessible to a user.
     */
    public List<Long> getAccessibleQuizIds(Long userId) {
        return authorizationService.getAccessibleQuizIds(userId);
    }

    /**
     * Require super-admin privileges.
     * Throws {@code AuthorizationException} if not a super admin.
     */
    public void requireSuperAdmin(Long userId) {
        authorizationService.requireSuperAdmin(userId);
    }

    // ── Access Resolution ────────────────────────────────────────────

    /**
     * Resolve an access code to determine the route type (participant/host/invalid).
     * Returns a public DTO with only IDs — no internal entity leakage.
     */
    public AccessResolutionResultDto resolveAccessCode(String accessCode) {
        AccessResolutionResult result = accessResolutionService.resolve(accessCode);
        return new AccessResolutionResultDto(
                result.routeType(), result.quizId(), result.teamId(), result.errorMessage());
    }
}
