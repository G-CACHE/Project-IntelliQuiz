package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.user.internal.domain.entities.User;
import com.intelliquiz.api.shared.enums.AdminPermission;
import com.intelliquiz.api.shared.exceptions.AuthorizationException;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Application service for authorization checks.
 * Verifies user permissions for quiz access and operations.
 */
@Service
public class AuthorizationService {

    private final QuizRepository quizRepository;

    public AuthorizationService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    /**
     * Checks if a user has access to a specific quiz.
     * Super admins have access to all quizzes.
     * Regular admins must have an assignment for the quiz.
     * 
     * @param user the user to check
     * @param quiz the quiz to check access for
     * @throws AuthorizationException if the user doesn't have access
     */
    public void checkQuizAccess(User user, Quiz quiz) {
        if (user.isSuperAdmin()) {
            return; // Super admins have access to all quizzes
        }

        boolean hasAccess = user.getAssignments().stream()
                .anyMatch(a -> a.getQuizId() != null && a.getQuizId().equals(quiz.getId()));

        if (!hasAccess) {
            throw new AuthorizationException("User does not have access to this quiz");
        }
    }

    /**
     * Checks if a user has a specific permission for a quiz.
     * Super admins have all permissions for all quizzes.
     * 
     * @param user the user to check
     * @param quiz the quiz to check permission for
     * @param permission the required permission
     * @throws AuthorizationException if the user doesn't have the permission
     */
    public void checkPermission(User user, Quiz quiz, AdminPermission permission) {
        if (!user.hasPermissionFor(quiz.getId(), permission)) {
            throw new AuthorizationException(
                    "User does not have " + permission + " permission for this quiz");
        }
    }

    /**
     * Returns the list of quizzes a user has access to.
     * Super admins get all quizzes.
     * Regular admins get only their assigned quizzes.
     * 
     * @param user the user to get accessible quizzes for
     * @return list of accessible quizzes
     */
    public List<Quiz> getAccessibleQuizzes(User user) {
        if (user.isSuperAdmin()) {
            return quizRepository.findAll();
        }
        List<Long> quizIds = user.getAccessibleQuizIds();
        return quizRepository.findAll().stream()
                .filter(q -> quizIds.contains(q.getId()))
                .toList();
    }

    /**
     * Requires that the user has super admin privileges.
     * Throws an exception if the user is not a super admin.
     * 
     * @param user the user to check
     * @throws AuthorizationException if the user is not a super admin
     */
    public void requireSuperAdmin(User user) {
        if (!user.isSuperAdmin()) {
            throw new AuthorizationException("This operation requires super admin privileges");
        }
    }
}
