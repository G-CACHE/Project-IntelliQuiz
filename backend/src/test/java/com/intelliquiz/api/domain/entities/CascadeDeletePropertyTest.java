package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for cascade delete behavior.
 * 
 * Feature: jpa-domain-entities, Property 3: Cascade Delete Behavior
 * Validates: Requirements 1.5, 5.4
 */
@JqwikSpringSupport
@DataJpaTest
@ActiveProfiles("test")
public class CascadeDeletePropertyTest {

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Property 3: Cascade Delete Behavior
     * For any User with QuizAssignments, deleting the User should cascade delete all assignments.
     */
    @Property(tries = 20)
    void userDeletionCascadesToAssignments(
            @ForAll("validUsernames") String username,
            @ForAll("validPasswords") String password,
            @ForAll SystemRole systemRole,
            @ForAll("validPermissionSets") Set<AdminPermission> permissions) {
        
        User user = new User(username, password, systemRole);
        entityManager.persistAndFlush(user);
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        QuizAssignment assignment = new QuizAssignment(user, quiz);
        assignment.setPermissions(permissions);
        user.addAssignment(assignment);
        entityManager.persistAndFlush(assignment);
        
        Long assignmentId = assignment.getId();
        Long userId = user.getId();
        
        entityManager.clear();
        
        // Delete user
        User userToDelete = entityManager.find(User.class, userId);
        entityManager.remove(userToDelete);
        entityManager.flush();
        entityManager.clear();
        
        // Verify assignment is also deleted
        QuizAssignment deletedAssignment = entityManager.find(QuizAssignment.class, assignmentId);
        assertThat(deletedAssignment).isNull();
    }

    @Provide
    Arbitrary<String> validUsernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50)
                .map(s -> s + System.nanoTime());
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .ofMinLength(8)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<Set<AdminPermission>> validPermissionSets() {
        return Arbitraries.of(AdminPermission.class)
                .set()
                .ofMinSize(0)
                .ofMaxSize(4);
    }

    /**
     * Property 3: Cascade Delete Behavior
     * For any Quiz with Questions and Teams, deleting the Quiz should cascade delete all.
     */
    @Property(tries = 20)
    void quizDeletionCascadesToQuestionsAndTeams(
            @ForAll("validTitles") String title,
            @ForAll("validQuestionTexts") String questionText,
            @ForAll QuestionType questionType,
            @ForAll Difficulty difficulty,
            @ForAll("validTeamNames") String teamName,
            @ForAll("validAccessCodes") String accessCode) {
        
        Quiz quiz = new Quiz(title, "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Question question = new Question(quiz, questionText, questionType, difficulty, "A");
        quiz.addQuestion(question);
        entityManager.persistAndFlush(question);
        
        Team team = new Team(quiz, teamName, accessCode);
        quiz.addTeam(team);
        entityManager.persistAndFlush(team);
        
        Long quizId = quiz.getId();
        Long questionId = question.getId();
        Long teamId = team.getId();
        
        entityManager.clear();
        
        // Delete quiz
        Quiz quizToDelete = entityManager.find(Quiz.class, quizId);
        entityManager.remove(quizToDelete);
        entityManager.flush();
        entityManager.clear();
        
        // Verify question and team are also deleted
        Question deletedQuestion = entityManager.find(Question.class, questionId);
        Team deletedTeam = entityManager.find(Team.class, teamId);
        
        assertThat(deletedQuestion).isNull();
        assertThat(deletedTeam).isNull();
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<String> validQuestionTexts() {
        return Arbitraries.strings()
                .ofMinLength(5)
                .ofMaxLength(200);
    }

    @Provide
    Arbitrary<String> validTeamNames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> validAccessCodes() {
        return Arbitraries.strings()
                .alpha()
                .ofLength(8);
    }
}
