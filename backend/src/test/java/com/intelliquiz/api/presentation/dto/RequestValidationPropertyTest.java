package com.intelliquiz.api.presentation.dto;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.SystemRole;
import com.intelliquiz.api.presentation.dto.request.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import net.jqwik.api.*;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property tests for request DTO validation consistency.
 * 
 * Feature: infrastructure-layer, Property 1: Request Validation Consistency
 * Validates: Requirements 12.1, 12.2, 12.3
 */
class RequestValidationPropertyTest {

    private final Validator validator;

    RequestValidationPropertyTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    // ==================== AccessCodeRequest Tests ====================

    @Property(tries = 10)
    void accessCodeRequestRejectsBlankCode(@ForAll("blankStrings") String code) {
        AccessCodeRequest request = new AccessCodeRequest(code);
        Set<ConstraintViolation<AccessCodeRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("code"));
    }

    @Property(tries = 10)
    void accessCodeRequestAcceptsNonBlankCode(@ForAll("nonBlankStrings") String code) {
        AccessCodeRequest request = new AccessCodeRequest(code);
        Set<ConstraintViolation<AccessCodeRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    // ==================== LoginRequest Tests ====================

    @Property(tries = 10)
    void loginRequestRejectsBlankUsername(@ForAll("blankStrings") String username) {
        LoginRequest request = new LoginRequest(username, "validPassword");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("username"));
    }

    @Property(tries = 10)
    void loginRequestRejectsBlankPassword(@ForAll("blankStrings") String password) {
        LoginRequest request = new LoginRequest("validUser", password);
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    // ==================== CreateQuizRequest Tests ====================

    @Property(tries = 10)
    void createQuizRequestRejectsBlankTitle(@ForAll("blankStrings") String title) {
        CreateQuizRequest request = new CreateQuizRequest(title, "description");
        Set<ConstraintViolation<CreateQuizRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Property(tries = 10)
    void createQuizRequestRejectsTitleOver200Chars(@ForAll("longStrings") String title) {
        CreateQuizRequest request = new CreateQuizRequest(title, "description");
        Set<ConstraintViolation<CreateQuizRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Property(tries = 10)
    void createQuizRequestAcceptsValidTitle(@ForAll("validTitles") String title) {
        CreateQuizRequest request = new CreateQuizRequest(title, "description");
        Set<ConstraintViolation<CreateQuizRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    // ==================== CreateQuestionRequest Tests ====================

    @Property(tries = 10)
    void createQuestionRequestRejectsNegativePoints(@ForAll("negativeInts") int points) {
        CreateQuestionRequest request = new CreateQuestionRequest(
                "Question text",
                QuestionType.MULTIPLE_CHOICE,
                Difficulty.MEDIUM,
                "A",
                points,
                30,
                List.of("A", "B", "C", "D")
        );
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("points"));
    }

    @Property(tries = 10)
    void createQuestionRequestRejectsNegativeTimeLimit(@ForAll("negativeInts") int timeLimit) {
        CreateQuestionRequest request = new CreateQuestionRequest(
                "Question text",
                QuestionType.MULTIPLE_CHOICE,
                Difficulty.MEDIUM,
                "A",
                10,
                timeLimit,
                List.of("A", "B", "C", "D")
        );
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("timeLimit"));
    }

    // ==================== CreateUserRequest Tests ====================

    @Property(tries = 10)
    void createUserRequestRejectsShortPassword(@ForAll("shortPasswords") String password) {
        CreateUserRequest request = new CreateUserRequest("username", password, SystemRole.ADMIN);
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    @Property(tries = 10)
    void createUserRequestAcceptsValidPassword(@ForAll("validPasswords") String password) {
        CreateUserRequest request = new CreateUserRequest("username", password, SystemRole.ADMIN);
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    // ==================== SubmitAnswerRequest Tests ====================

    @Property(tries = 10)
    void submitAnswerRequestRejectsNullTeamId() {
        SubmitAnswerRequest request = new SubmitAnswerRequest(null, 1L, "answer");
        Set<ConstraintViolation<SubmitAnswerRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("teamId"));
    }

    @Property(tries = 10)
    void submitAnswerRequestRejectsNullQuestionId() {
        SubmitAnswerRequest request = new SubmitAnswerRequest(1L, null, "answer");
        Set<ConstraintViolation<SubmitAnswerRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("questionId"));
    }

    @Property(tries = 10)
    void submitAnswerRequestRejectsBlankAnswer(@ForAll("blankStrings") String answer) {
        SubmitAnswerRequest request = new SubmitAnswerRequest(1L, 1L, answer);
        Set<ConstraintViolation<SubmitAnswerRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("answer"));
    }

    // ==================== Arbitraries ====================

    @Provide
    Arbitrary<String> blankStrings() {
        return Arbitraries.of("", "   ", "\t", "\n", null);
    }

    @Provide
    Arbitrary<String> nonBlankStrings() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> longStrings() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(201)
                .ofMaxLength(300);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(200);
    }

    @Provide
    Arbitrary<Integer> negativeInts() {
        return Arbitraries.integers().between(-1000, -1);
    }

    @Provide
    Arbitrary<String> shortPasswords() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(7);
    }

    @Provide
    Arbitrary<String> validPasswords() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(8)
                .ofMaxLength(50);
    }
}
