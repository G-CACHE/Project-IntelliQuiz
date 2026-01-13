package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.*;
import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.*;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for entity validation invariants.
 * 
 * Feature: application-layer, Property 11: Entity Validation Invariants
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
public class EntityValidationPropertyTest {

    /**
     * Property 11: Quiz title validation - blank titles are rejected
     */
    @Property(tries = 20)
    void quizTitleCannotBeBlank(@ForAll("blankStrings") String blankTitle) {
        Quiz quiz = new Quiz(blankTitle, "Description", "123456", QuizStatus.DRAFT);
        
        assertThatThrownBy(quiz::validateTitle)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("blank");
    }

    /**
     * Property 11: Quiz title validation - valid titles are accepted
     */
    @Property(tries = 20)
    void quizTitleValidationAcceptsValidTitles(@ForAll("validTitles") String validTitle) {
        Quiz quiz = new Quiz(validTitle, "Description", "123456", QuizStatus.DRAFT);
        
        // Should not throw
        quiz.validateTitle();
        assertThat(quiz.getTitle()).isEqualTo(validTitle);
    }

    /**
     * Property 11: Question points validation - negative points are rejected
     */
    @Property(tries = 20)
    void questionPointsCannotBeNegative(@ForAll("negativeIntegers") int negativePoints) {
        Question question = new Question(null, "Question?", QuestionType.IDENTIFICATION, 
                Difficulty.EASY, "answer");
        question.setPoints(negativePoints);
        
        assertThatThrownBy(question::validatePoints)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }

    /**
     * Property 11: Question points validation - non-negative points are accepted
     */
    @Property(tries = 20)
    void questionPointsValidationAcceptsNonNegative(@ForAll("nonNegativeIntegers") int points) {
        Question question = new Question(null, "Question?", QuestionType.IDENTIFICATION, 
                Difficulty.EASY, "answer");
        question.setPoints(points);
        
        // Should not throw
        question.validatePoints();
        assertThat(question.getPoints()).isEqualTo(points);
    }

    /**
     * Property 11: Team score validation - negative scores are rejected
     */
    @Property(tries = 20)
    void teamScoreCannotBeNegative(@ForAll("negativeIntegers") int negativeScore) {
        Team team = new Team(null, "Team", "ABC-123");
        team.setTotalScore(negativeScore);
        
        assertThatThrownBy(team::validateScore)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }

    /**
     * Property 11: Team score validation - non-negative scores are accepted
     */
    @Property(tries = 20)
    void teamScoreValidationAcceptsNonNegative(@ForAll("nonNegativeIntegers") int score) {
        Team team = new Team(null, "Team", "ABC-123");
        team.setTotalScore(score);
        
        // Should not throw
        team.validateScore();
        assertThat(team.getTotalScore()).isEqualTo(score);
    }

    /**
     * Property 11: Submission timestamp validation - future timestamps are rejected
     */
    @Property(tries = 20)
    void submissionTimestampCannotBeInFuture(@ForAll("futureTimestamps") LocalDateTime futureTime) {
        Submission submission = new Submission(null, null, "answer");
        submission.setSubmittedAt(futureTime);
        
        assertThatThrownBy(submission::validateSubmittedAt)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("future");
    }

    /**
     * Property 11: Submission timestamp validation - past/present timestamps are accepted
     */
    @Property(tries = 20)
    void submissionTimestampValidationAcceptsPastOrPresent(@ForAll("pastTimestamps") LocalDateTime pastTime) {
        Submission submission = new Submission(null, null, "answer");
        submission.setSubmittedAt(pastTime);
        
        // Should not throw
        submission.validateSubmittedAt();
        assertThat(submission.getSubmittedAt()).isEqualTo(pastTime);
    }

    /**
     * Property 11: User credentials validation - blank username is rejected
     */
    @Property(tries = 20)
    void userUsernameCannotBeBlank(@ForAll("blankStrings") String blankUsername) {
        User user = new User(blankUsername, "password123", SystemRole.ADMIN);
        
        assertThatThrownBy(user::validateCredentials)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username");
    }

    /**
     * Property 11: User credentials validation - short password is rejected
     */
    @Property(tries = 20)
    void userPasswordMustMeetMinimumLength(@ForAll("shortPasswords") String shortPassword) {
        User user = new User("validuser", shortPassword, SystemRole.ADMIN);
        
        assertThatThrownBy(user::validateCredentials)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password");
    }

    /**
     * Property 11: User credentials validation - valid credentials are accepted
     */
    @Property(tries = 20)
    void userCredentialsValidationAcceptsValidCredentials(
            @ForAll("validUsernames") String username,
            @ForAll("validPasswords") String password) {
        User user = new User(username, password, SystemRole.ADMIN);
        
        // Should not throw
        user.validateCredentials();
        assertThat(user.getUsername()).isEqualTo(username);
    }

    /**
     * Property 11: Multiple choice question validation - must have options
     */
    @Property(tries = 20)
    void multipleChoiceQuestionMustHaveOptions() {
        Question question = new Question(null, "Question?", QuestionType.MULTIPLE_CHOICE, 
                Difficulty.EASY, "A");
        // No options set
        
        assertThatThrownBy(question::validateOptions)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("options");
    }

    /**
     * Property 11: Multiple choice question validation - valid options are accepted
     */
    @Property(tries = 20)
    void multipleChoiceQuestionValidationAcceptsValidOptions(@ForAll("validOptionKeys") String correctKey) {
        Question question = new Question(null, "Question?", QuestionType.MULTIPLE_CHOICE, 
                Difficulty.EASY, correctKey);
        question.setOptions(List.of("Option A", "Option B", "Option C", "Option D"));
        
        // Should not throw
        question.validateOptions();
    }

    // ==================== Providers ====================

    @Provide
    Arbitrary<String> blankStrings() {
        return Arbitraries.of("", "   ", "\t", "\n", null);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<Integer> negativeIntegers() {
        return Arbitraries.integers().between(Integer.MIN_VALUE, -1);
    }

    @Provide
    Arbitrary<Integer> nonNegativeIntegers() {
        return Arbitraries.integers().between(0, 10000);
    }

    @Provide
    Arbitrary<LocalDateTime> futureTimestamps() {
        return Arbitraries.longs()
                .between(1, 365 * 10) // 1 to 10 years in days
                .map(days -> LocalDateTime.now().plusDays(days));
    }

    @Provide
    Arbitrary<LocalDateTime> pastTimestamps() {
        return Arbitraries.longs()
                .between(1, 365 * 10) // 1 to 10 years in days
                .map(days -> LocalDateTime.now().minusDays(days));
    }

    @Provide
    Arbitrary<String> shortPasswords() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(7); // Less than minimum 8 characters
    }

    @Provide
    Arbitrary<String> validUsernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(8)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<String> validOptionKeys() {
        return Arbitraries.of("A", "B", "C", "D", "a", "b", "c", "d");
    }
}
