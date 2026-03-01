package com.intelliquiz.api.auth.internal.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Utility service for creating HttpOnly, Secure, SameSite=Strict cookies
 * for JWT-based authentication.
 */
@Component
public class CookieService {

    public static final String ACCESS_COOKIE_NAME = "intelliquiz_token";

    @Value("${jwt.expiration:1800000}")
    private long jwtExpirationMs;

    /**
     * Creates an HttpOnly access-token cookie.
     */
    public ResponseCookie createAccessCookie(String token) {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
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
                .secure(true)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();
    }
}
