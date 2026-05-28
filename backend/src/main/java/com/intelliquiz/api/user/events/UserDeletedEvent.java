package com.intelliquiz.api.user.events;

/**
 * Published when an admin user is deleted.
 */
public record UserDeletedEvent(Long userId, String username) {}
