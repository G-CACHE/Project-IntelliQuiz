package com.intelliquiz.api.user;

import com.intelliquiz.api.user.dto.UserCredentialsDto;
import com.intelliquiz.api.user.dto.UserInfoDto;
import com.intelliquiz.api.user.internal.application.services.UserManagementService;
import com.intelliquiz.api.user.internal.domain.entities.User;
import com.intelliquiz.api.user.internal.domain.ports.UserRepository;
import com.intelliquiz.api.shared.enums.AdminPermission;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Public facade for the User module.
 * All cross-module access to user data should go through this facade.
 */
@Service
public class UserFacade {

    private final UserManagementService userManagementService;
    private final UserRepository userRepository;

    public UserFacade(UserManagementService userManagementService,
                      UserRepository userRepository) {
        this.userManagementService = userManagementService;
        this.userRepository = userRepository;
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

    /**
     * Find user credentials for authentication.
     * Returns password hash + role info so auth module can verify passwords
     * without accessing User entity directly.
     */
    public Optional<UserCredentialsDto> findCredentials(String username) {
        return userRepository.findByUsername(username)
                .map(user -> new UserCredentialsDto(
                        user.getId(),
                        user.getUsername(),
                        user.getPassword(),
                        user.getSystemRole(),
                        user.isSuperAdmin()));
    }

    /**
     * Check if a user has access to a specific quiz (any assignment).
     */
    public boolean hasAccessToQuiz(Long userId, Long quizId) {
        User user = userManagementService.getAdmin(userId);
        if (user.isSuperAdmin()) {
            return true;
        }
        return user.getAssignments().stream()
                .anyMatch(a -> a.getQuizId() != null && a.getQuizId().equals(quizId));
    }

    /**
     * Get all quiz IDs the user has access to.
     */
    public List<Long> getAccessibleQuizIds(Long userId) {
        User user = userManagementService.getAdmin(userId);
        return user.getAccessibleQuizIds();
    }
}
