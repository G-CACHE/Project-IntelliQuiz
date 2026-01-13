package com.intelliquiz.api.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time quiz communication.
 * Uses STOMP protocol over WebSocket with SockJS fallback.
 * 
 * Channel patterns:
 * - /topic/quiz/{quizId}/state - Game state broadcasts to all clients
 * - /topic/quiz/{quizId}/timer - Timer tick updates to all clients
 * - /topic/quiz/{quizId}/host - Host-only notifications
 * - /queue/team/{teamId} - Team-specific messages
 * - /user/queue/errors - Error messages to specific client
 * 
 * Application destinations:
 * - /app/quiz/{quizId}/command - Host control commands
 * - /app/quiz/{quizId}/submit - Participant answer submissions
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    public WebSocketConfig(WebSocketAuthInterceptor webSocketAuthInterceptor) {
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory broker for subscriptions
        // /topic - broadcast to multiple subscribers
        // /queue - point-to-point messaging
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint with SockJS fallback for browsers that don't support WebSocket
        registry.addEndpoint("/ws/quiz")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        
        // Raw WebSocket endpoint (without SockJS) for native clients
        registry.addEndpoint("/ws/quiz")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add authentication interceptor to validate access codes on CONNECT
        registration.interceptors(webSocketAuthInterceptor);
    }
}
