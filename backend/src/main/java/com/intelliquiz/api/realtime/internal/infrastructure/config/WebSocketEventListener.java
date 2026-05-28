package com.intelliquiz.api.realtime.internal.infrastructure.config;


/**
 * DEPRECATED: WebSocket event handling moved to REST/SSE architecture.
 * 
 * This file is kept for reference only and is no longer active.
 * Connection/disconnection now handled via:
 * - GET /api/quiz/{quizId}/stream - SSE connection established
 * - SSEConnectionRegistry.onTimeout/onCompletion - cleanup on close
 * 
 * Team join notifications now sent via REST POST to endpoints,
 * broadcasted via SSE to connected clients.
 * 
 * See: QuizSSEController.java, SSEConnectionRegistry.java
 */
@Deprecated(since = "2026-03-23", forRemoval = true)
public class WebSocketEventListener {
    // DEPRECATED - all functionality moved to SSE connection lifecycle in SSEConnectionRegistry
}
