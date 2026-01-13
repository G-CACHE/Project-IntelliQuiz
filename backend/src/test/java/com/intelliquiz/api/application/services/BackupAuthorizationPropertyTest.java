package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.SystemRole;
import com.intelliquiz.api.domain.exceptions.AuthorizationException;
import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for backup authorization enforcement.
 * Feature: database-backup-recovery
 */
class BackupAuthorizationPropertyTest {

    /**
     * Property 1: Authorization Enforcement
     * For any user without SUPER_ADMIN role and for any backup operation,
     * the Backup_Service should reject the request with an AuthorizationException.
     * 
     * Validates: Requirements 1.5, 2.3, 3.3, 4.5, 5.3
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Non-super-admin users are rejected")
    void nonSuperAdminUsersAreRejected(
            @ForAll("nonSuperAdminUsers") User user
    ) {
        AuthorizationService authorizationService = new AuthorizationService(null);
        
        // Verify that requireSuperAdmin throws AuthorizationException for non-super-admin users
        AuthorizationException exception = assertThrows(
                AuthorizationException.class,
                () -> authorizationService.requireSuperAdmin(user),
                "Non-super-admin users should be rejected"
        );
        
        assertNotNull(exception.getMessage());
        assertTrue(exception.getMessage().contains("super admin"));
    }

    /**
     * Property 1 (additional): Super admin users are allowed
     * For any user with SUPER_ADMIN role, the authorization check should pass.
     * 
     * Validates: Requirements 1.5, 2.3, 3.3, 4.5, 5.3
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Super admin users are allowed")
    void superAdminUsersAreAllowed(
            @ForAll("superAdminUsers") User user
    ) {
        AuthorizationService authorizationService = new AuthorizationService(null);
        
        // Verify that requireSuperAdmin does not throw for super admin users
        assertDoesNotThrow(
                () -> authorizationService.requireSuperAdmin(user),
                "Super admin users should be allowed"
        );
    }

    /**
     * Property 1 (additional): User role determines authorization outcome
     * For any user, the authorization outcome should be determined solely by their role.
     * 
     * Validates: Requirements 1.5, 2.3, 3.3, 4.5, 5.3
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Authorization determined by role")
    void authorizationDeterminedByRole(
            @ForAll @AlphaChars @StringLength(min = 3, max = 20) String username,
            @ForAll SystemRole role
    ) {
        User user = new User(username, "password123", role);
        AuthorizationService authorizationService = new AuthorizationService(null);
        
        if (role == SystemRole.SUPER_ADMIN) {
            // Super admins should pass
            assertDoesNotThrow(
                    () -> authorizationService.requireSuperAdmin(user),
                    "Super admin users should be allowed regardless of username"
            );
        } else {
            // Non-super-admins should be rejected
            assertThrows(
                    AuthorizationException.class,
                    () -> authorizationService.requireSuperAdmin(user),
                    "Non-super-admin users should be rejected regardless of username"
            );
        }
    }

    @Provide
    Arbitrary<User> nonSuperAdminUsers() {
        return Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(20)
                .map(username -> new User(username, "password123", SystemRole.ADMIN));
    }

    @Provide
    Arbitrary<User> superAdminUsers() {
        return Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(20)
                .map(username -> new User(username, "password123", SystemRole.SUPER_ADMIN));
    }
}
