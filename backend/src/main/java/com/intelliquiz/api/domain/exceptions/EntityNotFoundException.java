package com.intelliquiz.api.domain.exceptions;

/**
 * Thrown when a requested entity cannot be found in the system.
 */
public class EntityNotFoundException extends DomainException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entityType, Long id) {
        super(entityType + " with id " + id + " not found");
    }
}
