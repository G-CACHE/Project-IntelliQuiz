package com.intelliquiz.api.realtime.internal.infrastructure.config;


/**
 * DEPRECATED: WebSocket authentication moved to REST endpoints.
 * 
 * This file is kept for reference only and is no longer active.
 * Authentication now handled via:
 * - GET /api/quiz/{quizId}/stream - SSE connection auth
 * - POST endpoints with request parameters
 * 
 * See: QuizSSEController.java, REST controller implementations
 */
@Deprecated(since = "2026-03-23", forRemoval = true)
public class WebSocketAuthInterceptor {
    // DEPRECATED - all functionality moved to REST endpoint authentication
}
