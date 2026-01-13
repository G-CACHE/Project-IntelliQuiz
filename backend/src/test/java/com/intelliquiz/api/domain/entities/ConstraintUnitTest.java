package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.enums.SystemRole;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for database constraint validation.
 * 
 * Validates: Requirements 1.2, 3.2
 */
@DataJpaTest
@ActiveProfiles("test")
public class ConstraintUnitTest {

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Test: Duplicate username throws ConstraintViolationException
     * Validates: Requirement 1.2 - THE User_Entity SHALL have a unique username constraint
     */
    @Test
    void duplicateUsernameShouldThrowException() {
        // Create first user
        User user1 = new User("testuser", "password123", SystemRole.ADMIN);
        entityManager.persistAndFlush(user1);
        
        // Attempt to create second user with same username
        User user2 = new User("testuser", "differentpassword", SystemRole.SUPER_ADMIN);
        
        assertThatThrownBy(() -> entityManager.persistAndFlush(user2))
                .isInstanceOf(ConstraintViolationException.class);
    }

    /**
     * Test: Duplicate user+quiz combination throws ConstraintViolationException
     * Validates: Requirement 3.2 - THE QuizAssignment_Entity SHALL enforce a unique constraint 
     * on the user_id and quiz_id combination
     */
    @Test
    void duplicateQuizAssignmentShouldThrowException() {
        // Create user and quiz
        User user = new User("assignmentuser", "password123", SystemRole.ADMIN);
        entityManager.persistAndFlush(user);
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        // Create first assignment
        QuizAssignment assignment1 = new QuizAssignment(user, quiz);
        entityManager.persistAndFlush(assignment1);
        
        // Attempt to create second assignment with same user+quiz
        QuizAssignment assignment2 = new QuizAssignment(user, quiz);
        
        assertThatThrownBy(() -> entityManager.persistAndFlush(assignment2))
                .isInstanceOf(ConstraintViolationException.class);
    }

    /**
     * Test: Different usernames should be allowed
     * Validates: Requirement 1.2 - unique constraint only applies to same username
     */
    @Test
    void differentUsernamesShouldBeAllowed() {
        User user1 = new User("user1", "password123", SystemRole.ADMIN);
        entityManager.persistAndFlush(user1);
        
        User user2 = new User("user2", "password123", SystemRole.ADMIN);
        entityManager.persistAndFlush(user2);
        
        // Both users should exist
        User retrieved1 = entityManager.find(User.class, user1.getId());
        User retrieved2 = entityManager.find(User.class, user2.getId());
        
        org.assertj.core.api.Assertions.assertThat(retrieved1).isNotNull();
        org.assertj.core.api.Assertions.assertThat(retrieved2).isNotNull();
    }

    /**
     * Test: Same user can be assigned to different quizzes
     * Validates: Requirement 3.2 - unique constraint is on combination, not individual fields
     */
    @Test
    void sameUserDifferentQuizzesShouldBeAllowed() {
        User user = new User("multiassignuser", "password123", SystemRole.ADMIN);
        entityManager.persistAndFlush(user);
        
        Quiz quiz1 = new Quiz("Quiz 1", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz1);
        
        Quiz quiz2 = new Quiz("Quiz 2", "Description", "654321", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz2);
        
        QuizAssignment assignment1 = new QuizAssignment(user, quiz1);
        entityManager.persistAndFlush(assignment1);
        
        QuizAssignment assignment2 = new QuizAssignment(user, quiz2);
        entityManager.persistAndFlush(assignment2);
        
        // Both assignments should exist
        QuizAssignment retrieved1 = entityManager.find(QuizAssignment.class, assignment1.getId());
        QuizAssignment retrieved2 = entityManager.find(QuizAssignment.class, assignment2.getId());
        
        org.assertj.core.api.Assertions.assertThat(retrieved1).isNotNull();
        org.assertj.core.api.Assertions.assertThat(retrieved2).isNotNull();
    }
}
