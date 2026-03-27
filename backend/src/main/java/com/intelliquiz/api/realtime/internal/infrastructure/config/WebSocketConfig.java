package com.intelliquiz.api.realtime.internal.infrastructure.config;


/**
 * DEPRECATED: WebSocket configuration moved to Server-Sent Events (SSE).
 * 
 * This file is kept for reference only and is no longer active.
 * Real-time communications now use:
 * - GET /api/quiz/{quizId}/stream (SSE connection)
 * - POST /api/quiz/{quizId}/answer (REST endpoint)
 * - POST /api/quiz/{quizId}/command (REST endpoint)
 * - POST /api/quiz/{quizId}/violation (REST endpoint)
 * 
 * See: SSEConnectionRegistry.java, QuizSSEController.java, 
 *      QuizSubmissionController.java, QuizControlController.java
 */
@Deprecated(since = "2026-03-23", forRemoval = true)
public class WebSocketConfig {
    // DEPRECATED - all functionality moved to SSE/REST architecture
}
