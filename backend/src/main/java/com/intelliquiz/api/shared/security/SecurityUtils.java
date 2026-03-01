package com.intelliquiz.api.shared.security;

import com.intelliquiz.api.shared.enums.SystemRole;
import org.springframework.security.core.Authentication;

import java.util.Map;

/**
 * Utility for extracting user information from the SecurityContextHolder
 * Authentication object populated by JwtAuthenticationFilter.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // utility class
    }

    /**
     * Extracts the user ID from the authentication details map.
     *
     * @throws IllegalStateException if uid is missing
     */
    public static Long extractUserId(Authentication auth) {
        if (auth.getDetails() instanceof Map<?, ?> details) {
            Object uid = details.get("uid");
            if (uid instanceof Long l) return l;
            if (uid instanceof Number n) return n.longValue();
        }
        throw new IllegalStateException("User ID not found in authentication details");
    }

    /**
     * Extracts the SystemRole from the authentication authorities.
     */
    public static SystemRole extractRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .map(SystemRole::valueOf)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Role not found in authentication"));
    }

    /**
     * Returns the username (principal) from the authentication.
     */
    public static String extractUsername(Authentication auth) {
        return auth.getName();
    }
}
