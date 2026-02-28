package com.intelliquiz.api.user.internal.application.services;

import com.intelliquiz.api.user.internal.application.commands.CreateUserCommand;
import com.intelliquiz.api.user.internal.application.commands.UpdateUserCommand;
import com.intelliquiz.api.user.internal.domain.entities.QuizAssignment;
import com.intelliquiz.api.user.internal.domain.entities.User;
import com.intelliquiz.api.user.events.UserCreatedEvent;
import com.intelliquiz.api.user.events.UserDeletedEvent;
import com.intelliquiz.api.user.events.PermissionsAssignedEvent;
import com.intelliquiz.api.user.events.PermissionsRevokedEvent;
import com.intelliquiz.api.shared.enums.AdminPermission;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.auth.internal.domain.ports.PasswordHashingService;
import com.intelliquiz.api.user.internal.domain.ports.QuizAssignmentRepository;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.user.internal.domain.ports.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Application service for user management operations.
 * Handles admin account CRUD and quiz permission assignments.
 */
@Service
@Transactional
public class UserManagementService {

    private final UserRepository userRepository;
    private final QuizFacade quizFacade;
    private final QuizAssignmentRepository quizAssignmentRepository;
    private final PasswordHashingService passwordHashingService;
    private final ApplicationEventPublisher eventPublisher;

    public UserManagementService(UserRepository userRepository,
                                  QuizFacade quizFacade,
                                  QuizAssignmentRepository quizAssignmentRepository,
                                  PasswordHashingService passwordHashingService,
                                  ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.quizFacade = quizFacade;
        this.quizAssignmentRepository = quizAssignmentRepository;
        this.passwordHashingService = passwordHashingService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates a new admin user with hashed password.
     */
    public User createAdmin(CreateUserCommand command) {
        if (userRepository.existsByUsername(command.username())) {
            throw new IllegalArgumentException("Username already exists: " + command.username());
        }

        String hashedPassword = passwordHashingService.hash(command.password());
        User user = new User(command.username(), hashedPassword, command.role());
        user.validateCredentials();
        
        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new UserCreatedEvent(saved.getId(), saved.getUsername()));
        return saved;
    }

    /**
     * Updates an existing admin user.
     * If password is provided, it will be hashed.
     */
    public User updateAdmin(Long userId, UpdateUserCommand command) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        if (command.username() != null && !command.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(command.username())) {
                throw new IllegalArgumentException("Username already exists: " + command.username());
            }
            user.setUsername(command.username());
        }

        if (command.password() != null && !command.password().isBlank()) {
            String hashedPassword = passwordHashingService.hash(command.password());
            user.setPassword(hashedPassword);
        }

        user.validateCredentials();
        return userRepository.save(user);
    }

    /**
     * Deletes an admin user and all their quiz assignments.
     */
    public void deleteAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        String username = user.getUsername();
        // Assignments are cascade deleted via orphanRemoval
        userRepository.delete(user);
        eventPublisher.publishEvent(new UserDeletedEvent(userId, username));
    }

    /**
     * Gets an admin user by ID.
     */
    public User getAdmin(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
    }

    /**
     * Gets an admin user by username.
     */
    public User getAdminByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User with username " + username + " not found"));
    }

    /**
     * Gets all admin users.
     */
    public List<User> getAllAdmins() {
        return userRepository.findAll();
    }

    /**
     * Assigns quiz permissions to a user.
     * Creates a new assignment if one doesn't exist, or updates existing permissions.
     */
    public QuizAssignment assignQuizPermissions(Long userId, Long quizId, Set<AdminPermission> permissions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuizId(user, quizId)
                .orElseGet(() -> {
                    QuizAssignment newAssignment = new QuizAssignment(user, quizId);
                    user.addAssignment(newAssignment);
                    return newAssignment;
                });

        assignment.setPermissions(permissions);
        QuizAssignment saved = quizAssignmentRepository.save(assignment);
        eventPublisher.publishEvent(new PermissionsAssignedEvent(userId, quizId, permissions));
        return saved;
    }

    /**
     * Revokes all quiz access for a user from a specific quiz.
     */
    public void revokeQuizAccess(Long userId, Long quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }

        quizAssignmentRepository.findByUserAndQuizId(user, quizId)
                .ifPresent(assignment -> {
                    user.removeAssignment(assignment);
                    quizAssignmentRepository.delete(assignment);
                    eventPublisher.publishEvent(new PermissionsRevokedEvent(userId, quizId));
                });
    }

    /**
     * Gets all quiz assignments for a user.
     */
    public List<QuizAssignment> getUserAssignments(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return quizAssignmentRepository.findByUser(user);
    }

    /**
     * Grants a specific permission to a user for a quiz.
     */
    public QuizAssignment grantPermission(Long userId, Long quizId, AdminPermission permission) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuizId(user, quizId)
                .orElseGet(() -> {
                    QuizAssignment newAssignment = new QuizAssignment(user, quizId);
                    user.addAssignment(newAssignment);
                    return newAssignment;
                });

        assignment.grantPermission(permission);
        return quizAssignmentRepository.save(assignment);
    }

    /**
     * Revokes a specific permission from a user for a quiz.
     */
    public QuizAssignment revokePermission(Long userId, Long quizId, AdminPermission permission) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuizId(user, quizId)
                .orElseThrow(() -> new EntityNotFoundException("QuizAssignment for user " + userId + " and quiz " + quizId + " not found"));

        assignment.revokePermission(permission);
        return quizAssignmentRepository.save(assignment);
    }
}
