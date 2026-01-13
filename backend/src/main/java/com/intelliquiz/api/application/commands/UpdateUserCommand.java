package com.intelliquiz.api.application.commands;

/**
 * Command object for updating an existing user.
 */
public record UpdateUserCommand(
    String username,
    String password
) {}
