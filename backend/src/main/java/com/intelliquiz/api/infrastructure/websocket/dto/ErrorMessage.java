package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Error message sent to affected client.
 */
public record ErrorMessage(
        String code,
        String message
) {
    // Error codes
    public static final String TIME_EXPIRED = "TIME_EXPIRED";
    public static final String INVALID_STATE = "INVALID_STATE";
    public static final String NOT_HOST = "NOT_HOST";
    public static final String NOT_PARTICIPANT = "NOT_PARTICIPANT";
    public static final String INVALID_QUESTION = "INVALID_QUESTION";
    public static final String QUIZ_NOT_ACTIVE = "QUIZ_NOT_ACTIVE";
    public static final String INVALID_ACCESS_CODE = "INVALID_ACCESS_CODE";
    
    public static ErrorMessage timeExpired() {
        return new ErrorMessage(TIME_EXPIRED, "Time has expired. Submission rejected.");
    }
    
    public static ErrorMessage invalidState(String currentState) {
        return new ErrorMessage(INVALID_STATE, "Invalid operation for current state: " + currentState);
    }
    
    public static ErrorMessage notHost() {
        return new ErrorMessage(NOT_HOST, "Only the host can perform this action.");
    }
    
    public static ErrorMessage notParticipant() {
        return new ErrorMessage(NOT_PARTICIPANT, "Only participants can submit answers.");
    }
    
    public static ErrorMessage invalidQuestion() {
        return new ErrorMessage(INVALID_QUESTION, "Question not found or not active.");
    }
    
    public static ErrorMessage quizNotActive() {
        return new ErrorMessage(QUIZ_NOT_ACTIVE, "Quiz session is not active.");
    }
    
    public static ErrorMessage invalidAccessCode() {
        return new ErrorMessage(INVALID_ACCESS_CODE, "Invalid access code.");
    }
}
