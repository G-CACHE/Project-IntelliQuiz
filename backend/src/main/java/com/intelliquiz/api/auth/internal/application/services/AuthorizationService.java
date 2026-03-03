package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.user.UserFacade;
import com.intelliquiz.api.shared.enums.AdminPermission;
import com.intelliquiz.api.shared.exceptions.AuthorizationException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Application service for authorization checks.
 * Uses UserFacade and QuizFacade — no direct entity/repository access.
 */
@Service
public class AuthorizationService {

    private final UserFacade userFacade;
    private final QuizFacade quizFacade;

    public AuthorizationService(UserFacade userFacade, QuizFacade quizFacade) {
        this.userFacade = userFacade;
        this.quizFacade = quizFacade;
    }

    /**
     * Checks if a user has access to a specific quiz.
     */
    public void checkQuizAccess(Long userId, Long quizId) {
        if (userFacade.isSuperAdmin(userId)) {
            return;
        }
        if (!userFacade.hasAccessToQuiz(userId, quizId)) {
            throw new AuthorizationException("User does not have access to this quiz");
        }
    }

    /**
     * Checks if a user has a specific permission for a quiz.
     */
    public void checkPermission(Long userId, Long quizId, AdminPermission permission) {
        if (!userFacade.isSuperAdmin(userId) && !userFacade.hasPermission(userId, quizId, permission)) {
            throw new AuthorizationException(
                    "User does not have " + permission + " permission for this quiz");
        }
    }

    /**
     * Returns the list of quiz IDs a user has access to.
     */
    public List<Long> getAccessibleQuizIds(Long userId) {
        if (userFacade.isSuperAdmin(userId)) {
            return quizFacade.getAllQuizIds();
        }
        return userFacade.getAccessibleQuizIds(userId);
    }

    /**
     * Requires that the user has super admin privileges.
     */
    public void requireSuperAdmin(Long userId) {
        if (!userFacade.isSuperAdmin(userId)) {
            throw new AuthorizationException("This operation requires super admin privileges");
        }
    }
}
