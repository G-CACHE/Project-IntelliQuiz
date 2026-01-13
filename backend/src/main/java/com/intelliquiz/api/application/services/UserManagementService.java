package com.intelliquiz.api.application.services;

import com.intelliquiz.api.application.commands.CreateUserCommand;
import com.intelliquiz.api.application.commands.UpdateUserCommand;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.AdminPermission;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.PasswordHashingService;
import com.intelliquiz.api.domain.ports.QuizAssignmentRepository;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.UserRepository;
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
    private final QuizRepository quizRepository;
    private final QuizAssignmentRepository quizAssignmentRepository;
    private final PasswordHashingService passwordHashingService;

    public UserManagementService(UserRepository userRepository,
                                  QuizRepository quizRepository,
                                  QuizAssignmentRepository quizAssignmentRepository,
                                  PasswordHashingService passwordHashingService) {
        this.userRepository = userRepository;
        this.quizRepository = quizRepository;
        this.quizAssignmentRepository = quizAssignmentRepository;
        this.passwordHashingService = passwordHashingService;
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
        
        return userRepository.save(user);
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
        
        // Assignments are cascade deleted via orphanRemoval
        userRepository.delete(user);
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
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuiz(user, quiz)
                .orElseGet(() -> {
                    QuizAssignment newAssignment = new QuizAssignment(user, quiz);
                    user.addAssignment(newAssignment);
                    quiz.addAssignment(newAssignment);
                    return newAssignment;
                });

        assignment.setPermissions(permissions);
        return quizAssignmentRepository.save(assignment);
    }

    /**
     * Revokes all quiz access for a user from a specific quiz.
     */
    public void revokeQuizAccess(Long userId, Long quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        quizAssignmentRepository.findByUserAndQuiz(user, quiz)
                .ifPresent(assignment -> {
                    user.removeAssignment(assignment);
                    quiz.removeAssignment(assignment);
                    quizAssignmentRepository.delete(assignment);
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
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuiz(user, quiz)
                .orElseGet(() -> {
                    QuizAssignment newAssignment = new QuizAssignment(user, quiz);
                    user.addAssignment(newAssignment);
                    quiz.addAssignment(newAssignment);
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
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        QuizAssignment assignment = quizAssignmentRepository.findByUserAndQuiz(user, quiz)
                .orElseThrow(() -> new EntityNotFoundException("QuizAssignment for user " + userId + " and quiz " + quizId + " not found"));

        assignment.revokePermission(permission);
        return quizAssignmentRepository.save(assignment);
    }
}
