package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Server-Sent Event (SSE) payload for real-time game updates.
 * Sent to clients as: data: {json}\n\n
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SSEEvent {

    /**
     * Unique event identifier for replay on reconnect
     */
    @JsonProperty("eventId")
    private String eventId;

    /**
     * Event type determining payload structure
     */
    @JsonProperty("type")
    private EventType type;

    /**
     * Server timestamp when event was created
     */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    /**
     * Polymorphic event payload (structure varies by type)
     */
    @JsonProperty("data")
    private Object data;

    /**
     * Client retry hint in milliseconds (for EventSource)
     */
    @JsonProperty("retryMs")
    @Builder.Default
    private Integer retryMs = 3000;

    /**
     * Event type enumeration for SSE messaging
     */
    public enum EventType {
        // Game state transitions
        GAME_STATE,
        
        // Timer tick every second
        TIMER_TICK,
        
        // Answer reveal after timer expires
        ANSWER_REVEAL,
        
        // Team connection notifications
        TEAM_JOINED,
        TEAM_DISCONNECTED,
        
        // Host notifications
        SUBMISSION_NOTIFY,
        
        // Violation tracking
        VIOLATION_NOTIFY,
        
        // Kick notifications
        KICK_NOTIFICATION,

        // Re-entry approval notification (sent to the specific kicked team)
        REENTRY_APPROVED,
        
        // Error responses
        ERROR
    }

    /**
     * Creates a new SSEEvent with auto-generated ID and current timestamp
     */
    public static SSEEvent create(EventType type, Object data) {
        return SSEEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .type(type)
            .timestamp(LocalDateTime.now())
            .data(data)
            .retryMs(3000)
            .build();
    }

    /**
     * Creates an error event
     */
    public static SSEEvent error(String code, String message) {
        return SSEEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .type(EventType.ERROR)
            .timestamp(LocalDateTime.now())
            .data(ErrorPayload.builder()
                .code(code)
                .message(message)
                .build())
            .retryMs(3000)
            .build();
    }

    /**
     * Error payload structure for ERROR event type
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorPayload {
        private String code;
        private String message;
    }
}
