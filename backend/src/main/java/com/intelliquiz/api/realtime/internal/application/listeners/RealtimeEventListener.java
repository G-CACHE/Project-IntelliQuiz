package com.intelliquiz.api.realtime.internal.application.listeners;

import com.intelliquiz.api.realtime.internal.application.services.QuizBroadcastService;
import com.intelliquiz.api.realtime.internal.application.services.QuizSessionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Event listener for cross-module events relevant to the realtime module.
 * Listens for quiz and team lifecycle events published by other modules.
 */
@Component
public class RealtimeEventListener {

    private static final Logger logger = LoggerFactory.getLogger(RealtimeEventListener.class);

    private final QuizSessionManager sessionManager;
    private final QuizBroadcastService broadcastService;

    public RealtimeEventListener(QuizSessionManager sessionManager,
                                  QuizBroadcastService broadcastService) {
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
    }

    // Future: @EventListener methods for quiz lifecycle events
    // e.g., QuizDeletedEvent → cleanup session state
}
