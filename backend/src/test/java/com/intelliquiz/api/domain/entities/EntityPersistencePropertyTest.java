package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for entity persistence round-trip.
 * 
 * Feature: jpa-domain-entities, Property 1: Entity Persistence Round-Trip
 * Validates: Requirements 1.1, 1.3, 3.1, 3.4, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 10.1, 10.3, 11.1, 11.3, 11.4
 */
@JqwikSpringSupport
@DataJpaTest
@ActiveProfiles("test")
public class EntityPersistencePropertyTest {

    @Autowired
    private TestEntityManager entityManager;

    /**
     * Property 1: Entity Persistence Round-Trip
     * For any valid User entity, persisting and retrieving should produce equivalent field values.
     */
    @Property(tries = 20)
    void userPersistenceRoundTrip(
            @ForAll("validUsernames") String username,
            @ForAll("validPasswords") String password,
            @ForAll SystemRole systemRole) {
        
        User user = new User(username, password, systemRole);
        
        User persisted = entityManager.persistAndFlush(user);
        entityManager.clear();
        
        User retrieved = entityManager.find(User.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getUsername()).isEqualTo(username);
        assertThat(retrieved.getPassword()).isEqualTo(password);
        assertThat(retrieved.getSystemRole()).isEqualTo(systemRole);
    }

    @Provide
    Arbitrary<String> validUsernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50)
                .map(s -> s + System.nanoTime()); // Ensure uniqueness
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .ofMinLength(8)
                .ofMaxLength(100);
    }


    /**
     * Property 1: Entity Persistence Round-Trip
     * For any valid Quiz entity, persisting and retrieving should produce equivalent field values.
     */
    @Property(tries = 20)
    void quizPersistenceRoundTrip(
            @ForAll("validTitles") String title,
            @ForAll("validDescriptions") String description,
            @ForAll("validProctorPins") String proctorPin,
            @ForAll QuizStatus status) {
        
        Quiz quiz = new Quiz(title, description, proctorPin, status);
        
        Quiz persisted = entityManager.persistAndFlush(quiz);
        entityManager.clear();
        
        Quiz retrieved = entityManager.find(Quiz.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getTitle()).isEqualTo(title);
        assertThat(retrieved.getDescription()).isEqualTo(description);
        assertThat(retrieved.getProctorPin()).isEqualTo(proctorPin);
        assertThat(retrieved.getStatus()).isEqualTo(status);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<String> validDescriptions() {
        return Arbitraries.strings()
                .ofMinLength(0)
                .ofMaxLength(250);
    }

    @Provide
    Arbitrary<String> validProctorPins() {
        return Arbitraries.strings()
                .numeric()
                .ofLength(6);
    }

    /**
     * Property 1: Entity Persistence Round-Trip
     * For any valid Question entity, persisting and retrieving should produce equivalent field values.
     */
    @Property(tries = 20)
    void questionPersistenceRoundTrip(
            @ForAll("validQuestionTexts") String text,
            @ForAll QuestionType type,
            @ForAll Difficulty difficulty,
            @ForAll("validCorrectKeys") String correctKey,
            @ForAll("validPoints") int points,
            @ForAll("validTimeLimits") int timeLimit,
            @ForAll("validOrderIndexes") int orderIndex) {
        
        // Create parent Quiz first
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Question question = new Question(quiz, text, type, difficulty, correctKey);
        question.setPoints(points);
        question.setTimeLimit(timeLimit);
        question.setOrderIndex(orderIndex);
        
        Question persisted = entityManager.persistAndFlush(question);
        entityManager.clear();
        
        Question retrieved = entityManager.find(Question.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getText()).isEqualTo(text);
        assertThat(retrieved.getType()).isEqualTo(type);
        assertThat(retrieved.getDifficulty()).isEqualTo(difficulty);
        assertThat(retrieved.getCorrectKey()).isEqualTo(correctKey);
        assertThat(retrieved.getPoints()).isEqualTo(points);
        assertThat(retrieved.getTimeLimit()).isEqualTo(timeLimit);
        assertThat(retrieved.getOrderIndex()).isEqualTo(orderIndex);
    }

    @Provide
    Arbitrary<String> validQuestionTexts() {
        return Arbitraries.strings()
                .ofMinLength(5)
                .ofMaxLength(500);
    }

    @Provide
    Arbitrary<String> validCorrectKeys() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<Integer> validPoints() {
        return Arbitraries.integers().between(1, 100);
    }

    @Provide
    Arbitrary<Integer> validTimeLimits() {
        return Arbitraries.integers().between(10, 300);
    }

    @Provide
    Arbitrary<Integer> validOrderIndexes() {
        return Arbitraries.integers().between(0, 100);
    }


    /**
     * Property 1: Entity Persistence Round-Trip
     * For any valid Team entity, persisting and retrieving should produce equivalent field values.
     */
    @Property(tries = 20)
    void teamPersistenceRoundTrip(
            @ForAll("validTeamNames") String name,
            @ForAll("validAccessCodes") String accessCode) {
        
        // Create parent Quiz first
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Team team = new Team(quiz, name, accessCode);
        
        Team persisted = entityManager.persistAndFlush(team);
        entityManager.clear();
        
        Team retrieved = entityManager.find(Team.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getName()).isEqualTo(name);
        assertThat(retrieved.getAccessCode()).isEqualTo(accessCode);
        assertThat(retrieved.getTotalScore()).isEqualTo(0);
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
     * Property 1: Entity Persistence Round-Trip
     * For any valid Submission entity, persisting and retrieving should produce equivalent field values.
     */
    @Property(tries = 20)
    void submissionPersistenceRoundTrip(
            @ForAll("validSubmittedAnswers") String submittedAnswer,
            @ForAll boolean isCorrect,
            @ForAll("validPoints") int awardedPoints) {
        
        // Create parent entities
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        Team team = new Team(quiz, "TestTeam", "ABC12345");
        entityManager.persistAndFlush(team);
        
        Question question = new Question(quiz, "Test question?", QuestionType.MULTIPLE_CHOICE, 
                Difficulty.EASY, "A");
        entityManager.persistAndFlush(question);
        
        LocalDateTime submittedAt = LocalDateTime.now();
        Submission submission = new Submission(team, question, submittedAnswer);
        submission.setCorrect(isCorrect);
        submission.setAwardedPoints(awardedPoints);
        submission.setSubmittedAt(submittedAt);
        
        Submission persisted = entityManager.persistAndFlush(submission);
        entityManager.clear();
        
        Submission retrieved = entityManager.find(Submission.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getSubmittedAnswer()).isEqualTo(submittedAnswer);
        assertThat(retrieved.isCorrect()).isEqualTo(isCorrect);
        assertThat(retrieved.getAwardedPoints()).isEqualTo(awardedPoints);
    }

    @Provide
    Arbitrary<String> validSubmittedAnswers() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(200);
    }

    /**
     * Property 1: Entity Persistence Round-Trip
     * For any valid QuizAssignment entity with permissions, persisting and retrieving 
     * should produce equivalent field values including the permissions ElementCollection.
     */
    @Property(tries = 20)
    void quizAssignmentPersistenceRoundTrip(
            @ForAll("validUsernames") String username,
            @ForAll("validPasswords") String password,
            @ForAll SystemRole systemRole,
            @ForAll("validPermissionSets") Set<AdminPermission> permissions) {
        
        // Create parent entities
        User user = new User(username, password, systemRole);
        entityManager.persistAndFlush(user);
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        entityManager.persistAndFlush(quiz);
        
        QuizAssignment assignment = new QuizAssignment(user, quiz);
        assignment.setPermissions(permissions);
        
        QuizAssignment persisted = entityManager.persistAndFlush(assignment);
        entityManager.clear();
        
        QuizAssignment retrieved = entityManager.find(QuizAssignment.class, persisted.getId());
        
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getPermissions()).isEqualTo(permissions);
    }

    @Provide
    Arbitrary<Set<AdminPermission>> validPermissionSets() {
        return Arbitraries.of(AdminPermission.class)
                .set()
                .ofMinSize(0)
                .ofMaxSize(4);
    }
}
