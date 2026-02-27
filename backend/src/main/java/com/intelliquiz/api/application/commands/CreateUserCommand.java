package com.intelliquiz.api.application.commands;

import com.intelliquiz.api.shared.enums.SystemRole;

/**
 * Command object for creating a new user.
 */
public record CreateUserCommand(
    String username,
    String password,
    SystemRole role
) {}
