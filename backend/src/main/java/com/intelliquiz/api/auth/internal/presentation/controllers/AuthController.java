package com.intelliquiz.api.auth.internal.presentation.controllers;

import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
import com.intelliquiz.api.auth.internal.application.services.RefreshTokenService;
import com.intelliquiz.api.auth.internal.domain.entities.RefreshToken;
import com.intelliquiz.api.shared.exceptions.AuthenticationFailedException;
import com.intelliquiz.api.auth.internal.infrastructure.config.CookieService;
import com.intelliquiz.api.auth.internal.infrastructure.config.JwtConfig;
import com.intelliquiz.api.auth.internal.presentation.dto.request.LoginRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.response.AuthResponse;
import com.intelliquiz.api.shared.dto.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller for authentication.
 * Issues two HttpOnly cookies on login:
 *   - intelliquiz_token   (access token,  30 min, path=/)
 *   - intelliquiz_refresh (refresh token, 7 days, path=/api/auth/refresh)
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User login/logout with HttpOnly cookie JWT.")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final RefreshTokenService refreshTokenService;
    private final JwtConfig jwtConfig;
    private final CookieService cookieService;

    public AuthController(AuthenticationService authenticationService,
                          RefreshTokenService refreshTokenService,
                          JwtConfig jwtConfig,
                          CookieService cookieService) {
        this.authenticationService = authenticationService;
        this.refreshTokenService = refreshTokenService;
        this.jwtConfig = jwtConfig;
        this.cookieService = cookieService;
    }

    /**
     * Authenticates a user and sets both access + refresh token cookies.
     */
    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates with username/password. Sets HttpOnly access cookie (30 min) and refresh cookie (7 days)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthenticationResult result = authenticationService.authenticate(
                request.username(),
                request.password()
        );

        if (!result.success()) {
            throw new AuthenticationFailedException("Invalid credentials");
        }

        String accessToken = jwtConfig.generateToken(
                result.username(),
                result.role().name(),
                result.userId()
        );
        String refreshToken = refreshTokenService.createRefreshToken(
                result.userId(), result.username(), result.role().name());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createAccessCookie(accessToken).toString());
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createRefreshCookie(refreshToken).toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(new AuthResponse(result.username(), result.role()));
    }

    /**
     * Issues a new access token (and rotates the refresh token) using the refresh cookie.
     */
    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh access token",
            description = "Uses the HttpOnly refresh cookie to issue a new access token and rotate the refresh token."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid refresh token",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String rawRefreshToken = extractRefreshCookie(request)
                .orElseThrow(() -> new AuthenticationFailedException("Missing refresh token"));

        RefreshToken stored = refreshTokenService.validate(rawRefreshToken)
                .orElseThrow(() -> new AuthenticationFailedException("Invalid or expired refresh token"));

        // Issue new access token using data from the stored refresh token record
        String newAccessToken = jwtConfig.generateTokenForRefresh(
                stored.getUsername(), stored.getRole(), stored.getUserId());

        // Rotate refresh token (revoke old, issue new)
        String newRefreshToken = refreshTokenService.rotate(
                rawRefreshToken, stored.getUserId(), stored.getUsername(), stored.getRole());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createAccessCookie(newAccessToken).toString());
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createRefreshCookie(newRefreshToken).toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(new AuthResponse(stored.getUsername(), com.intelliquiz.api.shared.enums.SystemRole.valueOf(stored.getRole())));
    }

    /**
     * Logs out the user by revoking all refresh tokens and clearing both cookies.
     */
    @PostMapping("/logout")
    @Operation(
            summary = "Logout user",
            description = "Revokes the refresh token and clears both HttpOnly cookies."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Logged out successfully")
    })
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        // Best-effort revocation — if cookie is missing we still clear cookies
        extractRefreshCookie(request)
                .flatMap(refreshTokenService::validate)
                .ifPresent(stored -> refreshTokenService.revokeAll(stored.getUserId()));

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createClearAccessCookie().toString());
        headers.add(HttpHeaders.SET_COOKIE, cookieService.createClearRefreshCookie().toString());

        return ResponseEntity.noContent()
                .headers(headers)
                .build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Optional<String> extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        for (Cookie cookie : request.getCookies()) {
            if (CookieService.REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                String value = cookie.getValue();
                return (value != null && !value.isBlank()) ? Optional.of(value) : Optional.empty();
            }
        }
        return Optional.empty();
    }
}
