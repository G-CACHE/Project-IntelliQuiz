package com.intelliquiz.api.user.dto;

import com.intelliquiz.api.shared.enums.SystemRole;

/**
 * Public read-only DTO for cross-module user information.
 */
public record UserInfoDto(Long id, String username, SystemRole role) {}
