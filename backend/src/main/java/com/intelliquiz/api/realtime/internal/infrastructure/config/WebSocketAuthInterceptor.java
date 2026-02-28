package com.intelliquiz.api.realtime.internal.infrastructure.config;

import com.intelliquiz.api.auth.AuthFacade;
import com.intelliquiz.api.auth.dto.AccessResolutionResultDto;
import com.intelliquiz.api.shared.enums.RouteType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * WebSocket authentication interceptor that validates access codes on CONNECT.
 * Sets the principal with team/host identity for subsequent message handling.
 * Uses AuthFacade instead of direct internal service access.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    private static final String ACCESS_CODE_HEADER = "accessCode";

    private final AuthFacade authFacade;

    public WebSocketAuthInterceptor(AuthFacade authFacade) {
        this.authFacade = authFacade;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String accessCode = accessor.getFirstNativeHeader(ACCESS_CODE_HEADER);
            
            logger.info("WebSocket CONNECT attempt with accessCode: {}", accessCode != null ? accessCode : "null");
            
            if (accessCode == null || accessCode.isBlank()) {
                logger.warn("WebSocket CONNECT rejected: Access code is required");
                throw new IllegalArgumentException("Access code is required");
            }
            
            try {
                AccessResolutionResultDto result = authFacade.resolveAccessCode(accessCode);
                
                logger.info("Access resolution result for '{}': routeType={}, errorMessage={}",
                        accessCode, result.routeType(), result.errorMessage());
                
                if (result.routeType() == RouteType.INVALID) {
                    logger.warn("WebSocket CONNECT rejected: Invalid access code '{}' - {}", accessCode, result.errorMessage());
                    throw new IllegalArgumentException("Invalid access code: " + result.errorMessage());
                }
                
                // Create principal based on access type
                QuizPrincipal principal = createPrincipal(result);
                accessor.setUser(principal);
                
                logger.info("WebSocket CONNECT accepted: {} for quiz {}", principal.getName(), principal.quizId());
            } catch (Exception e) {
                logger.error("WebSocket CONNECT error for accessCode '{}': {}", accessCode, e.getMessage(), e);
                throw e;
            }
        }
        
        return message;
    }

    private QuizPrincipal createPrincipal(AccessResolutionResultDto result) {
        return switch (result.routeType()) {
            case HOST -> new QuizPrincipal(
                    "host-" + result.quizId(),
                    result.quizId(),
                    null,
                    true
            );
            case PARTICIPANT -> new QuizPrincipal(
                    "team-" + result.teamId(),
                    result.quizId(),
                    result.teamId(),
                    false
            );
            case INVALID -> throw new IllegalStateException("Invalid route type should not reach here");
        };
    }

    /**
     * Principal representing a connected WebSocket client.
     * Contains quiz context and role information.
     */
    public record QuizPrincipal(
            String name,
            Long quizId,
            Long teamId,
            boolean isHost
    ) implements Principal {
        @Override
        public String getName() {
            return name;
        }
    }
}
