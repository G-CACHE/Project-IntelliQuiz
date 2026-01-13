package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for relationship integrity.
 * 
 * Feature: jpa-domain-entities, Property 2: Relationship Integrity
 * Validates: Requirements 1.4, 3.3, 5.3, 7.5, 10.2, 10.4, 11.2
 */
@JqwikSpringSupport
@DataJpaTest
@ActiveProfiles("test")
public class RelationshipIntegrityPropertyTest {

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Property 2: Relationship Integrity
     * For any User with QuizAssignments, navigating from User to assignments 
     * and back to User should return the same User.
     */
    @Property(tries = 20)
    void userToQuizAssignmentBidirectionalNavigation(
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
        entityManager.clear();
        
        User retrievedUser = entityManager.find(User.class, user.getId());
        
        assertThat(retrievedUser.getAssignments()).isNotEmpty();
        QuizAssignment retrievedAssignment = retrievedUser.getAssignments().get(0);
        assertThat(retrievedAssignment.getUser().getId()).isEqualTo(retrievedUser.getId());
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
     * Property 2: Relationship Integrity
     * For any Quiz with Questions, navigating from Quiz to questions 
     * and back to Quiz should return the same Quiz.
     */
    @Property(tries = 20)
    void quizToQuestionBidirectionalNavigation(
            @ForAll("validTitles") String title,
            @ForAll("validQuestionTexts") String questionText,
            @ForAll QuestionType questionType,
            @ForAll Difficulty difficulty) {
        
        Quiz quiz = new Quiz(title, "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Question question = new Question(quiz, questionText, questionType, difficulty, "A");
        quiz.addQuestion(question);
        
        entityManager.persistAndFlush(question);
        entityManager.clear();
        
        Quiz retrievedQuiz = entityManager.find(Quiz.class, quiz.getId());
        
        assertThat(retrievedQuiz.getQuestions()).isNotEmpty();
        Question retrievedQuestion = retrievedQuiz.getQuestions().get(0);
        assertThat(retrievedQuestion.getQuiz().getId()).isEqualTo(retrievedQuiz.getId());
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

    /**
     * Property 2: Relationship Integrity
     * For any Quiz with Teams, navigating from Quiz to teams 
     * and back to Quiz should return the same Quiz.
     */
    @Property(tries = 20)
    void quizToTeamBidirectionalNavigation(
            @ForAll("validTitles") String title,
            @ForAll("validTeamNames") String teamName,
            @ForAll("validAccessCodes") String accessCode) {
        
        Quiz quiz = new Quiz(title, "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Team team = new Team(quiz, teamName, accessCode);
        quiz.addTeam(team);
        
        entityManager.persistAndFlush(team);
        entityManager.clear();
        
        Quiz retrievedQuiz = entityManager.find(Quiz.class, quiz.getId());
        
        assertThat(retrievedQuiz.getTeams()).isNotEmpty();
        Team retrievedTeam = retrievedQuiz.getTeams().get(0);
        assertThat(retrievedTeam.getQuiz().getId()).isEqualTo(retrievedQuiz.getId());
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


    /**
     * Property 2: Relationship Integrity
     * For any Team with Submissions, navigating from Team to submissions 
     * and back to Team should return the same Team.
     */
    @Property(tries = 20)
    void teamToSubmissionBidirectionalNavigation(
            @ForAll("validTeamNames") String teamName,
            @ForAll("validAccessCodes") String accessCode,
            @ForAll("validSubmittedAnswers") String submittedAnswer) {
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Team team = new Team(quiz, teamName, accessCode);
        entityManager.persistAndFlush(team);
        
        Question question = new Question(quiz, "Test question?", QuestionType.MULTIPLE_CHOICE, 
                Difficulty.EASY, "A");
        entityManager.persistAndFlush(question);
        
        Submission submission = new Submission(team, question, submittedAnswer);
        team.addSubmission(submission);
        
        entityManager.persistAndFlush(submission);
        entityManager.clear();
        
        Team retrievedTeam = entityManager.find(Team.class, team.getId());
        
        assertThat(retrievedTeam.getSubmissions()).isNotEmpty();
        Submission retrievedSubmission = retrievedTeam.getSubmissions().get(0);
        assertThat(retrievedSubmission.getTeam().getId()).isEqualTo(retrievedTeam.getId());
    }

    @Provide
    Arbitrary<String> validSubmittedAnswers() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(200);
    }

    /**
     * Property 2: Relationship Integrity
     * For any QuizAssignment, navigating to Quiz and back should maintain integrity.
     */
    @Property(tries = 20)
    void quizAssignmentToQuizBidirectionalNavigation(
            @ForAll("validUsernames") String username,
            @ForAll("validPasswords") String password,
            @ForAll SystemRole systemRole,
            @ForAll("validTitles") String quizTitle) {
        
        User user = new User(username, password, systemRole);
        entityManager.persistAndFlush(user);
        
        Quiz quiz = new Quiz(quizTitle, "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        QuizAssignment assignment = new QuizAssignment(user, quiz);
        quiz.addAssignment(assignment);
        
        entityManager.persistAndFlush(assignment);
        entityManager.clear();
        
        Quiz retrievedQuiz = entityManager.find(Quiz.class, quiz.getId());
        
        assertThat(retrievedQuiz.getAssignments()).isNotEmpty();
        QuizAssignment retrievedAssignment = retrievedQuiz.getAssignments().get(0);
        assertThat(retrievedAssignment.getQuiz().getId()).isEqualTo(retrievedQuiz.getId());
    }
}
