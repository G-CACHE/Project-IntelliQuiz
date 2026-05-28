package com.intelliquiz.api.user.internal.domain.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import com.intelliquiz.api.shared.enums.AdminPermission;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

/**
 * QuizAssignment entity representing the permission contract mapping a User to a Quiz.
 * Maps to the "quiz_assignment" database table.
 * 
 * Rich domain entity with behavior methods for permission management.
 * References Quiz by ID only (module-decoupled).
 */
@Entity
@Table(name = "quiz_assignment", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "quiz_id"})
})
@SQLDelete(sql = "UPDATE quiz_assignment SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class QuizAssignment extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference("user-assignments")
    private User user;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @ElementCollection(targetClass = AdminPermission.class)
    @CollectionTable(name = "assignment_permission",
                     joinColumns = @JoinColumn(name = "assignment_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    private Set<AdminPermission> permissions = new HashSet<>();

    public QuizAssignment() {
    }

    public QuizAssignment(User user, Long quizId) {
        this.user = user;
        this.quizId = quizId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Set<AdminPermission> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<AdminPermission> permissions) {
        this.permissions = permissions;
    }

    public void addPermission(AdminPermission permission) {
        permissions.add(permission);
    }

    public void removePermission(AdminPermission permission) {
        permissions.remove(permission);
    }

    public boolean hasPermission(AdminPermission permission) {
        return permissions.contains(permission);
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Grants a specific permission to this assignment.
     * 
     * @param permission the permission to grant
     */
    public void grantPermission(AdminPermission permission) {
        permissions.add(permission);
    }

    /**
     * Revokes a specific permission from this assignment.
     * 
     * @param permission the permission to revoke
     */
    public void revokePermission(AdminPermission permission) {
        permissions.remove(permission);
    }

    /**
     * Grants all available permissions to this assignment.
     */
    public void grantAllPermissions() {
        permissions.addAll(EnumSet.allOf(AdminPermission.class));
    }

    /**
     * Revokes all permissions from this assignment.
     */
    public void revokeAllPermissions() {
        permissions.clear();
    }
}
