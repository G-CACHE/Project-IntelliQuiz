package com.intelliquiz.api.user.internal.application.commands;

/**
 * Command object for updating an existing user.
 */
public record UpdateUserCommand(
    String username,
    String password
) {}
