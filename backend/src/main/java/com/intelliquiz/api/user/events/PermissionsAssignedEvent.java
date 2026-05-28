package com.intelliquiz.api.user.events;

import com.intelliquiz.api.shared.enums.AdminPermission;
import java.util.Set;

/**
 * Published when quiz permissions are assigned to a user.
 */
public record PermissionsAssignedEvent(Long userId, Long quizId, Set<AdminPermission> permissions) {}
