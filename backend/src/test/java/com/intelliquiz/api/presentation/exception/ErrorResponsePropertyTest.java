package com.intelliquiz.api.presentation.exception;

import com.intelliquiz.api.domain.exceptions.*;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import net.jqwik.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property tests for error response format consistency.
 * 
 * Feature: infrastructure-layer, Property 2: Error Response Format Consistency
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
class ErrorResponsePropertyTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Property(tries = 10)
    void entityNotFoundExceptionReturns404WithConsistentFormat(
            @ForAll("entityTypes") String entityType,
            @ForAll @From("positiveIds") Long id) {
        // Given
        EntityNotFoundException ex = new EntityNotFoundException(entityType, id);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleEntityNotFound(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void duplicateSubmissionExceptionReturns409WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        DuplicateSubmissionException ex = new DuplicateSubmissionException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleDuplicateSubmission(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void authorizationExceptionReturns403WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        AuthorizationException ex = new AuthorizationException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleAuthorization(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(403);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void authenticationFailedExceptionReturns401WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        AuthenticationFailedException ex = new AuthenticationFailedException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleAuthenticationFailed(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(401);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void illegalArgumentExceptionReturns400WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        IllegalArgumentException ex = new IllegalArgumentException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleIllegalArgument(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void genericExceptionReturns500WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        Exception ex = new RuntimeException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
        // Generic errors should not expose internal details
        assertThat(response.getBody().message()).doesNotContain(message);
    }

    @Property(tries = 10)
    void quizNotReadyExceptionReturns400WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        QuizNotReadyException ex = new QuizNotReadyException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleQuizNotReady(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Property(tries = 10)
    void invalidQuizStateExceptionReturns400WithConsistentFormat(
            @ForAll("errorMessages") String message) {
        // Given
        InvalidQuizStateException ex = new InvalidQuizStateException(message);

        // When
        ResponseEntity<ErrorResponse> response = handler.handleInvalidQuizState(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isNotBlank();
        assertThat(response.getBody().timestamp()).isNotBlank();
    }

    @Provide
    Arbitrary<String> entityTypes() {
        return Arbitraries.of("Quiz", "Question", "Team", "User", "Submission");
    }

    @Provide
    Arbitrary<Long> positiveIds() {
        return Arbitraries.longs().between(1L, 10000L);
    }

    @Provide
    Arbitrary<String> errorMessages() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(5)
                .ofMaxLength(50);
    }
}
