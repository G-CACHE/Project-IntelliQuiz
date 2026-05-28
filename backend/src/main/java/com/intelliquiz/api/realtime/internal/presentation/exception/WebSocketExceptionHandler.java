package com.intelliquiz.api.realtime.internal.presentation.exception;

/**
 * DEPRECATED: WebSocket exception handling moved to REST controller exception handling.
 * 
 * Error responses are now returned directly from REST endpoints with appropriate
 * HTTP status codes instead of being pushed via STOMP messages.
 * 
 * See: QuizSSEController, QuizSubmissionController, QuizControlController, QuizViolationController
 */
@Deprecated(since = "2026-03-23", forRemoval = true)
public class WebSocketExceptionHandler {
    // DEPRECATED - exception handling moved to REST controller advice
}
