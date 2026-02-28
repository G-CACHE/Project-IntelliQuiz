package com.intelliquiz.api.user.events;

/**
 * Published when quiz permissions are revoked from a user.
 */
public record PermissionsRevokedEvent(Long userId, Long quizId) {}
