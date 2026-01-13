package com.intelliquiz.api.presentation.exception;

import com.intelliquiz.api.domain.exceptions.*;
import com.intelliquiz.api.domain.exceptions.BackupException;
import com.intelliquiz.api.domain.exceptions.BackupFileNotFoundException;
import com.intelliquiz.api.domain.exceptions.BackupNotFoundException;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for consistent API error responses.
 * Maps domain exceptions to appropriate HTTP status codes.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles EntityNotFoundException - returns 404 Not Found.
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        logger.warn("Entity not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.NOT_FOUND.value()));
    }

    /**
     * Handles DuplicateSubmissionException - returns 409 Conflict.
     */
    @ExceptionHandler(DuplicateSubmissionException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateSubmission(DuplicateSubmissionException ex) {
        logger.warn("Duplicate submission: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.CONFLICT.value()));
    }

    /**
     * Handles AuthorizationException - returns 403 Forbidden.
     */
    @ExceptionHandler(AuthorizationException.class)
    public ResponseEntity<ErrorResponse> handleAuthorization(AuthorizationException ex) {
        logger.warn("Authorization failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.FORBIDDEN.value()));
    }

    /**
     * Handles AuthenticationFailedException - returns 401 Unauthorized.
     */
    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationFailed(AuthenticationFailedException ex) {
        logger.warn("Authentication failed");
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.UNAUTHORIZED.value()));
    }

    /**
     * Handles QuizNotReadyException - returns 400 Bad Request.
     */
    @ExceptionHandler(QuizNotReadyException.class)
    public ResponseEntity<ErrorResponse> handleQuizNotReady(QuizNotReadyException ex) {
        logger.warn("Quiz not ready: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
    }

    /**
     * Handles InvalidQuizStateException - returns 400 Bad Request.
     */
    @ExceptionHandler(InvalidQuizStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidQuizState(InvalidQuizStateException ex) {
        logger.warn("Invalid quiz state: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
    }

    /**
     * Handles IllegalArgumentException - returns 400 Bad Request.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Invalid argument: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
    }

    /**
     * Handles BackupNotFoundException - returns 404 Not Found.
     */
    @ExceptionHandler(BackupNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleBackupNotFound(BackupNotFoundException ex) {
        logger.warn("Backup not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.NOT_FOUND.value()));
    }

    /**
     * Handles BackupFileNotFoundException - returns 404 Not Found.
     */
    @ExceptionHandler(BackupFileNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleBackupFileNotFound(BackupFileNotFoundException ex) {
        logger.warn("Backup file not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.NOT_FOUND.value()));
    }

    /**
     * Handles BackupException - returns 500 Internal Server Error.
     */
    @ExceptionHandler(BackupException.class)
    public ResponseEntity<ErrorResponse> handleBackupException(BackupException ex) {
        logger.error("Backup operation failed: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }

    /**
     * Handles validation errors - returns 400 Bad Request with field-level errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        logger.warn("Validation failed: {}", fieldErrors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.withFieldErrors("Validation failed", HttpStatus.BAD_REQUEST.value(), fieldErrors));
    }

    /**
     * Handles all other exceptions - returns 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        logger.error("Unexpected error occurred", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }
}
