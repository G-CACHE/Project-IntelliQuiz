package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.AdminPermission;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.enums.SystemRole;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotBlank;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for User permission checking.
 * 
 * Feature: application-layer, Property 8: User Permission Authorization
 * Validates: Requirements 8.4, 8.5, 9.1, 9.2, 9.3, 9.4
 */
public class UserPermissionPropertyTest {

    /**
     * Property 8: isSuperAdmin() returns true iff systemRole is SUPER_ADMIN
     */
    @Property(tries = 20)
    void isSuperAdminReturnsCorrectValue(@ForAll("systemRoles") SystemRole role) {
        User user = new User("testuser", "password123", role);
        
        assertThat(user.isSuperAdmin()).isEqualTo(role == SystemRole.SUPER_ADMIN);
    }

    /**
     * Property 8: Super admins have all permissions for all quizzes
     */
    @Property(tries = 20)
    void superAdminHasAllPermissions(
            @ForAll("adminPermissions") AdminPermission permission) {
        User superAdmin = new User("superadmin", "password123", SystemRole.SUPER_ADMIN);
        Quiz quiz = createQuiz("Test Quiz");
        
        assertThat(superAdmin.hasPermissionFor(quiz, permission)).isTrue();
    }

    /**
     * Property 8: Regular admins only have explicitly granted permissions
     */
    @Property(tries = 20)
    void regularAdminOnlyHasGrantedPermissions(
            @ForAll("adminPermissions") AdminPermission grantedPermission,
            @ForAll("adminPermissions") AdminPermission checkedPermission) {
        User admin = new User("admin", "password123", SystemRole.ADMIN);
        Quiz quiz = createQuiz("Test Quiz");
        
        QuizAssignment assignment = new QuizAssignment(admin, quiz);
        assignment.grantPermission(grantedPermission);
        admin.addAssignment(assignment);
        
        boolean expected = grantedPermission == checkedPermission;
        assertThat(admin.hasPermissionFor(quiz, checkedPermission)).isEqualTo(expected);
    }

    /**
     * Property 8: Admin without assignment has no permissions
     */
    @Property(tries = 20)
    void adminWithoutAssignmentHasNoPermissions(
            @ForAll("adminPermissions") AdminPermission permission) {
        User admin = new User("admin", "password123", SystemRole.ADMIN);
        Quiz quiz = createQuiz("Test Quiz");
        
        assertThat(admin.hasPermissionFor(quiz, permission)).isFalse();
    }

    /**
     * Property 8: getAccessibleQuizzes returns assigned quizzes
     */
    @Property(tries = 20)
    void getAccessibleQuizzesReturnsAssignedQuizzes(
            @ForAll @NotBlank String quizTitle) {
        User admin = new User("admin", "password123", SystemRole.ADMIN);
        Quiz quiz = createQuiz(quizTitle);
        
        QuizAssignment assignment = new QuizAssignment(admin, quiz);
        admin.addAssignment(assignment);
        
        assertThat(admin.getAccessibleQuizzes()).contains(quiz);
    }

    /**
     * Property 8: validateCredentials throws for blank username
     */
    @Property(tries = 5)
    void validateCredentialsThrowsForBlankUsername() {
        User user = new User("", "password123", SystemRole.ADMIN);
        
        assertThatThrownBy(user::validateCredentials)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username cannot be blank");
    }

    /**
     * Property 8: validateCredentials throws for short password
     */
    @Property(tries = 5)
    void validateCredentialsThrowsForShortPassword() {
        User user = new User("testuser", "short", SystemRole.ADMIN);
        
        assertThatThrownBy(user::validateCredentials)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password must be at least");
    }

    /**
     * Property 8: validateCredentials passes for valid credentials
     */
    @Property(tries = 20)
    void validateCredentialsPassesForValidCredentials(
            @ForAll @NotBlank String username,
            @ForAll("validPasswords") String password) {
        User user = new User(username, password, SystemRole.ADMIN);
        
        // Should not throw
        user.validateCredentials();
    }

    @Provide
    Arbitrary<SystemRole> systemRoles() {
        return Arbitraries.of(SystemRole.values());
    }

    @Provide
    Arbitrary<AdminPermission> adminPermissions() {
        return Arbitraries.of(AdminPermission.values());
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(8)
                .ofMaxLength(20);
    }

    private Quiz createQuiz(String title) {
        Quiz quiz = new Quiz(title, "Description", "123-456", QuizStatus.DRAFT);
        quiz.setId(1L);
        return quiz;
    }
}
