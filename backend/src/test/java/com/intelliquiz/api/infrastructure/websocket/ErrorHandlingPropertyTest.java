package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.infrastructure.websocket.dto.ErrorMessage;
import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for WebSocket error handling.
 * Feature: websocket-realtime
 */
class ErrorHandlingPropertyTest {

    /**
     * Feature: websocket-realtime, Property 19: Error Message Delivery
     * For any error condition, the affected client SHALL receive an ErrorMessage
     * with a non-empty error code and descriptive message.
     * 
     * **Validates: Requirements 9.3**
     */
    @Example
    void timeExpiredErrorHasCodeAndMessage() {
        ErrorMessage error = ErrorMessage.timeExpired();
        
        assertThat(error.code())
                .as("Error code should not be empty")
                .isNotBlank();
        assertThat(error.code())
                .as("Error code should be TIME_EXPIRED")
                .isEqualTo("TIME_EXPIRED");
        assertThat(error.message())
                .as("Error message should not be empty")
                .isNotBlank();
    }

    @Example
    void invalidStateErrorHasCodeAndMessage() {
        ErrorMessage error = ErrorMessage.invalidState("GRADING");
        
        assertThat(error.code())
                .as("Error code should not be empty")
                .isNotBlank();
        assertThat(error.code())
                .as("Error code should be INVALID_STATE")
                .isEqualTo("INVALID_STATE");
        assertThat(error.message())
                .as("Error message should not be empty")
                .isNotBlank();
        assertThat(error.message())
                .as("Error message should contain the state")
                .contains("GRADING");
    }

    @Example
    void invalidQuestionErrorHasCodeAndMessage() {
        ErrorMessage error = ErrorMessage.invalidQuestion();
        
        assertThat(error.code())
                .as("Error code should not be empty")
                .isNotBlank();
        assertThat(error.code())
                .as("Error code should be INVALID_QUESTION")
                .isEqualTo("INVALID_QUESTION");
        assertThat(error.message())
                .as("Error message should not be empty")
                .isNotBlank();
    }

    @Example
    void notHostErrorHasCodeAndMessage() {
        ErrorMessage error = ErrorMessage.notHost();
        
        assertThat(error.code())
                .as("Error code should not be empty")
                .isNotBlank();
        assertThat(error.code())
                .as("Error code should be NOT_HOST")
                .isEqualTo("NOT_HOST");
        assertThat(error.message())
                .as("Error message should not be empty")
                .isNotBlank();
    }

    /**
     * Property: All error factory methods produce valid ErrorMessage objects.
     */
    @Property(tries = 20)
    void allErrorMessagesHaveNonEmptyCodeAndMessage(
            @ForAll("errorTypes") String errorType
    ) {
        ErrorMessage error = switch (errorType) {
            case "TIME_EXPIRED" -> ErrorMessage.timeExpired();
            case "INVALID_STATE" -> ErrorMessage.invalidState("TEST");
            case "INVALID_QUESTION" -> ErrorMessage.invalidQuestion();
            case "NOT_HOST" -> ErrorMessage.notHost();
            default -> new ErrorMessage("UNKNOWN", "Unknown error");
        };
        
        assertThat(error.code())
                .as("Error code should not be null or empty")
                .isNotBlank();
        assertThat(error.message())
                .as("Error message should not be null or empty")
                .isNotBlank();
    }

    @Provide
    Arbitrary<String> errorTypes() {
        return Arbitraries.of("TIME_EXPIRED", "INVALID_STATE", "INVALID_QUESTION", "NOT_HOST");
    }
}
