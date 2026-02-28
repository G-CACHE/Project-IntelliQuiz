package com.intelliquiz.api.user;

import com.intelliquiz.api.user.dto.UserInfoDto;
import com.intelliquiz.api.user.internal.application.services.UserManagementService;
import com.intelliquiz.api.user.internal.domain.entities.User;
import com.intelliquiz.api.shared.enums.AdminPermission;
import org.springframework.stereotype.Service;

/**
 * Public facade for the User module.
 * All cross-module access to user data should go through this facade.
 */
@Service
public class UserFacade {

    private final UserManagementService userManagementService;

    public UserFacade(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * Get read-only user info by username.
     */
    public UserInfoDto getUserByUsername(String username) {
        User user = userManagementService.getAdminByUsername(username);
        return new UserInfoDto(user.getId(), user.getUsername(), user.getSystemRole());
    }

    /**
     * Get read-only user info by ID.
     */
    public UserInfoDto getUserById(Long userId) {
        User user = userManagementService.getAdmin(userId);
        return new UserInfoDto(user.getId(), user.getUsername(), user.getSystemRole());
    }

    /**
     * Check if a user has a specific permission for a quiz.
     */
    public boolean hasPermission(Long userId, Long quizId, AdminPermission permission) {
        User user = userManagementService.getAdmin(userId);
        return user.hasPermissionFor(quizId, permission);
    }

    /**
     * Check if a user is a super admin.
     */
    public boolean isSuperAdmin(Long userId) {
        User user = userManagementService.getAdmin(userId);
        return user.isSuperAdmin();
    }

    /**
     * Check if a user exists by username.
     */
    public boolean existsByUsername(String username) {
        try {
            userManagementService.getAdminByUsername(username);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
