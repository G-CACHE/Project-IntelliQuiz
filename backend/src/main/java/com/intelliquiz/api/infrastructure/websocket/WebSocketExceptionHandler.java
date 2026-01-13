package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.infrastructure.websocket.dto.ErrorMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

/**
 * Exception handler for WebSocket message processing.
 * Sends error messages to the affected client.
 */
@ControllerAdvice
public class WebSocketExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketExceptionHandler.class);

    @MessageExceptionHandler(IllegalArgumentException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("WebSocket illegal argument: {}", e.getMessage());
        return new ErrorMessage("INVALID_ARGUMENT", e.getMessage());
    }

    @MessageExceptionHandler(IllegalStateException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleIllegalState(IllegalStateException e) {
        logger.warn("WebSocket illegal state: {}", e.getMessage());
        return ErrorMessage.invalidState(e.getMessage());
    }

    @MessageExceptionHandler(EntityNotFoundException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleEntityNotFound(EntityNotFoundException e) {
        logger.warn("WebSocket entity not found: {}", e.getMessage());
        return new ErrorMessage("NOT_FOUND", e.getMessage());
    }

    @MessageExceptionHandler(SecurityException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleSecurityException(SecurityException e) {
        logger.warn("WebSocket security exception: {}", e.getMessage());
        return ErrorMessage.notHost();
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleGenericException(Exception e) {
        logger.error("WebSocket unexpected error: {}", e.getMessage(), e);
        return new ErrorMessage("INTERNAL_ERROR", "An unexpected error occurred");
    }
}
