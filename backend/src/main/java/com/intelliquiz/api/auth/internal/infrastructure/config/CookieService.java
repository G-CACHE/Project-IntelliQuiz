package com.intelliquiz.api.auth.internal.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Utility service for creating HttpOnly, SameSite=Lax cookies
 * for JWT-based authentication.
 */
@Component
public class CookieService {

    public static final String ACCESS_COOKIE_NAME = "intelliquiz_token";
    public static final String REFRESH_COOKIE_NAME = "intelliquiz_refresh";

    @Value("${jwt.expiration:1800000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    @Value("${cookie.secure:false}")
    private boolean secureCookie;

    /**
     * Creates an HttpOnly access-token cookie (short-lived).
     */
    public ResponseCookie createAccessCookie(String token) {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .build();
    }

    /**
     * Creates an HttpOnly refresh-token cookie (long-lived).
     * Scoped to /api/auth/refresh so it is only sent to the refresh endpoint.
     */
    public ResponseCookie createRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth/refresh")
                .maxAge(refreshExpirationMs / 1000)
                .build();
    }

    /**
     * Clears the access-token cookie.
     */
    public ResponseCookie createClearAccessCookie() {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    /**
     * Clears the refresh-token cookie.
     */
    public ResponseCookie createClearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    /**
     * @deprecated Use {@link #createClearAccessCookie()} instead.
     */
    @Deprecated
    public ResponseCookie createClearCookie() {
        return createClearAccessCookie();
    }
}
