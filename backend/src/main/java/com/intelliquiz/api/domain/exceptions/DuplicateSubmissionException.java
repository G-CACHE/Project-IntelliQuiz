package com.intelliquiz.api.domain.exceptions;

/**
 * Thrown when a team attempts to submit an answer for a question they have already answered.
 */
public class DuplicateSubmissionException extends DomainException {

    public DuplicateSubmissionException(String message) {
        super(message);
    }
}
