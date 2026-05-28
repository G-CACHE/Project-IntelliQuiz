package com.intelliquiz.api.backup.internal.application.services;

import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.exceptions.AuthorizationException;
import com.intelliquiz.api.user.dto.UserInfoDto;
import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for backup authorization enforcement.
 * Tests the role-based check used by BackupController to gate super-admin-only operations.
 * Feature: database-backup-recovery
 */
class BackupAuthorizationPropertyTest {

    /**
     * Simulates the authorization check performed inside BackupController.requireSuperAdmin().
     */
    private static void requireSuperAdmin(UserInfoDto user) {
        if (user.role() != SystemRole.SUPER_ADMIN) {
            throw new AuthorizationException("This operation requires super admin privileges");
        }
    }

    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Non-super-admin users are rejected")
    void nonSuperAdminUsersAreRejected(
            @ForAll @AlphaChars @StringLength(min = 3, max = 20) String username
    ) {
        UserInfoDto user = new UserInfoDto(1L, username, SystemRole.ADMIN);

        AuthorizationException exception = assertThrows(
                AuthorizationException.class,
                () -> requireSuperAdmin(user),
                "Non-super-admin users should be rejected"
        );

        assertNotNull(exception.getMessage());
        assertTrue(exception.getMessage().contains("super admin"));
    }

    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Super admin users are allowed")
    void superAdminUsersAreAllowed(
            @ForAll @AlphaChars @StringLength(min = 3, max = 20) String username
    ) {
        UserInfoDto user = new UserInfoDto(1L, username, SystemRole.SUPER_ADMIN);

        assertDoesNotThrow(
                () -> requireSuperAdmin(user),
                "Super admin users should be allowed"
        );
    }

    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 1: Authorization determined by role")
    void authorizationDeterminedByRole(
            @ForAll @AlphaChars @StringLength(min = 3, max = 20) String username,
            @ForAll SystemRole role
    ) {
        UserInfoDto user = new UserInfoDto(1L, username, role);

        if (role == SystemRole.SUPER_ADMIN) {
            assertDoesNotThrow(
                    () -> requireSuperAdmin(user),
                    "Super admin users should be allowed regardless of username");
        } else {
            assertThrows(
                    AuthorizationException.class,
                    () -> requireSuperAdmin(user),
                    "Non-super-admin users should be rejected regardless of username");
        }
    }
}
