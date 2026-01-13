package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.intelliquiz.api.domain.enums.AdminPermission;
import com.intelliquiz.api.domain.enums.SystemRole;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * User entity representing a system administrator account.
 * Maps to the "user" database table.
 * 
 * Rich domain entity with behavior methods for permission checking and validation.
 */
@Entity
@Table(name = "\"user\"")
public class User {

    private static final int MIN_PASSWORD_LENGTH = 8;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "system_role", nullable = false)
    private SystemRole systemRole;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("user-assignments")
    private List<QuizAssignment> assignments = new ArrayList<>();

    public User() {
    }

    public User(String username, String password, SystemRole systemRole) {
        this.username = username;
        this.password = password;
        this.systemRole = systemRole;
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Checks if this user has super admin privileges.
     * Super admins have unrestricted access to all quizzes and permissions.
     * 
     * @return true if the user's system role is SUPER_ADMIN
     */
    public boolean isSuperAdmin() {
        return this.systemRole == SystemRole.SUPER_ADMIN;
    }

    /**
     * Checks if this user has a specific permission for a given quiz.
     * Super admins automatically have all permissions for all quizzes.
     * Regular admins must have an explicit QuizAssignment with the permission.
     * 
     * @param quiz the quiz to check permission for
     * @param permission the permission to check
     * @return true if the user has the specified permission for the quiz
     */
    public boolean hasPermissionFor(Quiz quiz, AdminPermission permission) {
        if (isSuperAdmin()) {
            return true;
        }
        return assignments.stream()
                .filter(a -> a.getQuiz() != null && a.getQuiz().getId().equals(quiz.getId()))
                .anyMatch(a -> a.hasPermission(permission));
    }

    /**
     * Returns the list of quizzes this user has access to via assignments.
     * Note: Super admins should be handled separately as they have access to all quizzes.
     * 
     * @return list of quizzes the user is assigned to
     */
    @JsonIgnore
    public List<Quiz> getAccessibleQuizzes() {
        return assignments.stream()
                .map(QuizAssignment::getQuiz)
                .toList();
    }

    /**
     * Validates that the user's credentials meet the required constraints.
     * 
     * @throws IllegalArgumentException if username is blank or password is too short
     */
    public void validateCredentials() {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
    }

    // ==================== Getters and Setters ====================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public SystemRole getSystemRole() {
        return systemRole;
    }

    public void setSystemRole(SystemRole systemRole) {
        this.systemRole = systemRole;
    }

    public List<QuizAssignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<QuizAssignment> assignments) {
        this.assignments = assignments;
    }

    public void addAssignment(QuizAssignment assignment) {
        assignments.add(assignment);
        assignment.setUser(this);
    }

    public void removeAssignment(QuizAssignment assignment) {
        assignments.remove(assignment);
        assignment.setUser(null);
    }
}
