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

    @Value("${jwt.expiration:1800000}")
    private long jwtExpirationMs;

    @Value("${cookie.secure:false}")
    private boolean secureCookie;

    /**
     * Creates an HttpOnly access-token cookie.
     */
    public ResponseCookie createAccessCookie(String token) {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtExpirationMs / 1000) // seconds
                .build();
    }

    /**
     * Creates a cookie that clears the access token (Max-Age=0).
     */
    public ResponseCookie createClearCookie() {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }
}
