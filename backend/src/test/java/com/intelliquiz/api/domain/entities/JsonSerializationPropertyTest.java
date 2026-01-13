package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Property-based tests for JSON serialization safety.
 * 
 * Feature: jpa-domain-entities, Property 4: JSON Serialization Safety
 * Validates: Requirements 12.1
 */
@JqwikSpringSupport
@DataJpaTest
@ActiveProfiles("test")
public class JsonSerializationPropertyTest {

    @Autowired
    private TestEntityManager entityManager;

    private final ObjectMapper objectMapper;
    
    public JsonSerializationPropertyTest() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Property 4: JSON Serialization Safety
     * For any User with bidirectional relationships, serialization should complete without infinite recursion.
     */
    @Property(tries = 20)
    void userSerializationDoesNotCauseInfiniteRecursion(
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
        
        assertThatCode(() -> {
            String json = objectMapper.writeValueAsString(retrievedUser);
            assertThat(json).isNotEmpty();
            assertThat(json).contains(username);
        }).doesNotThrowAnyException();
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
                .alpha()
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
     * Property 4: JSON Serialization Safety
     * For any Quiz with bidirectional relationships, serialization should complete without infinite recursion.
     */
    @Property(tries = 20)
    void quizSerializationDoesNotCauseInfiniteRecursion(
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
        entityManager.clear();
        
        Quiz retrievedQuiz = entityManager.find(Quiz.class, quiz.getId());
        
        assertThatCode(() -> {
            String json = objectMapper.writeValueAsString(retrievedQuiz);
            assertThat(json).isNotEmpty();
            assertThat(json).contains(title);
        }).doesNotThrowAnyException();
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
                .alpha()
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

    /**
     * Property 4: JSON Serialization Safety
     * For any Team with Submissions, serialization should complete without infinite recursion.
     */
    @Property(tries = 20)
    void teamSerializationDoesNotCauseInfiniteRecursion(
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
        
        assertThatCode(() -> {
            String json = objectMapper.writeValueAsString(retrievedTeam);
            assertThat(json).isNotEmpty();
            assertThat(json).contains(teamName);
        }).doesNotThrowAnyException();
    }

    @Provide
    Arbitrary<String> validSubmittedAnswers() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(200);
    }
}
