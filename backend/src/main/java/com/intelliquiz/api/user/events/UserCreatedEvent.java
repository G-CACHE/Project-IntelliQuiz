package com.intelliquiz.api.user.events;

/**
 * Published when a new admin user is created.
 */
public record UserCreatedEvent(Long userId, String username) {}
