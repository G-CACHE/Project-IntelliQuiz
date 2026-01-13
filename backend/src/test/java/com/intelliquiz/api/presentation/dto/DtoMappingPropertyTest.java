package com.intelliquiz.api.presentation.dto;

import com.intelliquiz.api.application.commands.CreateQuestionCommand;
import com.intelliquiz.api.application.commands.CreateQuizCommand;
import com.intelliquiz.api.application.commands.CreateUserCommand;
import com.intelliquiz.api.domain.entities.*;
import com.intelliquiz.api.domain.enums.*;
import com.intelliquiz.api.presentation.dto.request.*;
import com.intelliquiz.api.presentation.dto.response.*;
import net.jqwik.api.*;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property tests for DTO to domain mapping correctness.
 * 
 * Feature: infrastructure-layer, Property 4: DTO to Domain Mapping Correctness
 * Validates: Requirements 3.3, 3.4, 5.2, 5.3, 6.2, 7.1, 9.1, 9.2
 */
class DtoMappingPropertyTest {

    // ==================== Request DTO to Command Mapping ====================

    @Property(tries = 10)
    void createQuizRequestMapsToCommandWithoutDataLoss(
            @ForAll("validTitles") String title,
            @ForAll("descriptions") String description) {
        // Given
        CreateQuizRequest request = new CreateQuizRequest(title, description);
        
        // When
        CreateQuizCommand command = new CreateQuizCommand(request.title(), request.description());
        
        // Then
        assertThat(command.title()).isEqualTo(title);
        assertThat(command.description()).isEqualTo(description);
    }

    @Property(tries = 10)
    void createQuestionRequestMapsToCommandWithoutDataLoss(
            @ForAll("questionTexts") String text,
            @ForAll QuestionType type,
            @ForAll Difficulty difficulty,
            @ForAll("correctKeys") String correctKey,
            @ForAll("nonNegativeInts") int points,
            @ForAll("nonNegativeInts") int timeLimit) {
        // Given
        List<String> options = List.of("A", "B", "C", "D");
        CreateQuestionRequest request = new CreateQuestionRequest(
                text, type, difficulty, correctKey, points, timeLimit, options
        );
        
        // When
        CreateQuestionCommand command = new CreateQuestionCommand(
                request.text(),
                request.type(),
                request.difficulty(),
                request.correctKey(),
                request.points(),
                request.timeLimit(),
                request.options()
        );
        
        // Then
        assertThat(command.text()).isEqualTo(text);
        assertThat(command.type()).isEqualTo(type);
        assertThat(command.difficulty()).isEqualTo(difficulty);
        assertThat(command.correctKey()).isEqualTo(correctKey);
        assertThat(command.points()).isEqualTo(points);
        assertThat(command.timeLimit()).isEqualTo(timeLimit);
        assertThat(command.options()).isEqualTo(options);
    }

    @Property(tries = 10)
    void createUserRequestMapsToCommandWithoutDataLoss(
            @ForAll("usernames") String username,
            @ForAll("validPasswords") String password,
            @ForAll SystemRole role) {
        // Given
        CreateUserRequest request = new CreateUserRequest(username, password, role);
        
        // When
        CreateUserCommand command = new CreateUserCommand(
                request.username(),
                request.password(),
                request.role()
        );
        
        // Then
        assertThat(command.username()).isEqualTo(username);
        assertThat(command.password()).isEqualTo(password);
        assertThat(command.role()).isEqualTo(role);
    }

    // ==================== Entity to Response DTO Mapping ====================

    @Property(tries = 10)
    void quizResponseMapsFromEntityWithoutDataLoss(
            @ForAll("positiveIds") Long id,
            @ForAll("validTitles") String title,
            @ForAll("descriptions") String description,
            @ForAll("proctorPins") String proctorPin,
            @ForAll boolean isLiveSession,
            @ForAll QuizStatus status) {
        // Given
        Quiz quiz = new Quiz(title, description, proctorPin, status);
        quiz.setId(id);
        quiz.setLiveSession(isLiveSession);
        
        // When
        QuizResponse response = QuizResponse.from(quiz);
        
        // Then
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.title()).isEqualTo(title);
        assertThat(response.description()).isEqualTo(description);
        assertThat(response.proctorPin()).isEqualTo(proctorPin);
        assertThat(response.isLiveSession()).isEqualTo(isLiveSession);
        assertThat(response.status()).isEqualTo(status);
    }

    @Property(tries = 10)
    void teamResponseMapsFromEntityWithoutDataLoss(
            @ForAll("positiveIds") Long id,
            @ForAll("teamNames") String name,
            @ForAll("accessCodes") String accessCode,
            @ForAll("nonNegativeInts") int totalScore) {
        // Given
        Team team = new Team();
        team.setId(id);
        team.setName(name);
        team.setAccessCode(accessCode);
        team.setTotalScore(totalScore);
        
        // When
        TeamResponse response = TeamResponse.from(team);
        
        // Then
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.name()).isEqualTo(name);
        assertThat(response.accessCode()).isEqualTo(accessCode);
        assertThat(response.totalScore()).isEqualTo(totalScore);
    }

    @Property(tries = 10)
    void userResponseMapsFromEntityWithoutDataLoss(
            @ForAll("positiveIds") Long id,
            @ForAll("usernames") String username,
            @ForAll SystemRole role) {
        // Given
        User user = new User(username, "hashedPassword", role);
        user.setId(id);
        
        // When
        UserResponse response = UserResponse.from(user);
        
        // Then
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.username()).isEqualTo(username);
        assertThat(response.role()).isEqualTo(role);
    }

    @Property(tries = 10)
    void questionResponseMapsFromEntityWithoutDataLoss(
            @ForAll("positiveIds") Long id,
            @ForAll("questionTexts") String text,
            @ForAll QuestionType type,
            @ForAll Difficulty difficulty,
            @ForAll("correctKeys") String correctKey,
            @ForAll("nonNegativeInts") int points,
            @ForAll("nonNegativeInts") int timeLimit,
            @ForAll("nonNegativeInts") int orderIndex) {
        // Given
        Question question = new Question();
        question.setId(id);
        question.setText(text);
        question.setType(type);
        question.setDifficulty(difficulty);
        question.setCorrectKey(correctKey);
        question.setPoints(points);
        question.setTimeLimit(timeLimit);
        question.setOrderIndex(orderIndex);
        question.setOptions(List.of("A", "B", "C", "D"));
        
        // When
        QuestionResponse response = QuestionResponse.from(question);
        
        // Then
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.text()).isEqualTo(text);
        assertThat(response.type()).isEqualTo(type);
        assertThat(response.difficulty()).isEqualTo(difficulty);
        assertThat(response.correctKey()).isEqualTo(correctKey);
        assertThat(response.points()).isEqualTo(points);
        assertThat(response.timeLimit()).isEqualTo(timeLimit);
        assertThat(response.orderIndex()).isEqualTo(orderIndex);
    }

    @Property(tries = 10)
    void submissionResponseMapsFromEntityWithoutDataLoss(
            @ForAll("positiveIds") Long id,
            @ForAll("answers") String submittedAnswer,
            @ForAll boolean isCorrect,
            @ForAll("nonNegativeInts") int awardedPoints) {
        // Given
        Submission submission = new Submission();
        submission.setId(id);
        submission.setSubmittedAnswer(submittedAnswer);
        submission.setCorrect(isCorrect);
        submission.setAwardedPoints(awardedPoints);
        submission.setSubmittedAt(LocalDateTime.now());
        
        // When
        SubmissionResponse response = SubmissionResponse.from(submission);
        
        // Then
        assertThat(response.id()).isEqualTo(id);
        assertThat(response.submittedAnswer()).isEqualTo(submittedAnswer);
        assertThat(response.isCorrect()).isEqualTo(isCorrect);
        assertThat(response.awardedPoints()).isEqualTo(awardedPoints);
    }

    // ==================== Arbitraries ====================

    @Provide
    Arbitrary<Long> positiveIds() {
        return Arbitraries.longs().between(1L, 10000L);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<String> descriptions() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(0)
                .ofMaxLength(500);
    }

    @Provide
    Arbitrary<String> questionTexts() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(5)
                .ofMaxLength(200);
    }

    @Provide
    Arbitrary<String> correctKeys() {
        return Arbitraries.of("A", "B", "C", "D");
    }

    @Provide
    Arbitrary<Integer> nonNegativeInts() {
        return Arbitraries.integers().between(0, 1000);
    }

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(8)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> teamNames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    @Provide
    Arbitrary<String> accessCodes() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofLength(6)
                .map(String::toUpperCase);
    }

    @Provide
    Arbitrary<String> proctorPins() {
        return Arbitraries.strings()
                .numeric()
                .ofLength(6);
    }

    @Provide
    Arbitrary<String> answers() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }
}
