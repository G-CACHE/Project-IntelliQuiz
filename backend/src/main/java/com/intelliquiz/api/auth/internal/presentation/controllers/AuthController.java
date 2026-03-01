package com.intelliquiz.api.auth.internal.presentation.controllers;

import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
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
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication.
 * Public endpoint - no authentication required.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User login/logout with HttpOnly cookie JWT.")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final JwtConfig jwtConfig;
    private final CookieService cookieService;

    public AuthController(AuthenticationService authenticationService,
                          JwtConfig jwtConfig,
                          CookieService cookieService) {
        this.authenticationService = authenticationService;
        this.jwtConfig = jwtConfig;
        this.cookieService = cookieService;
    }

    /**
     * Authenticates a user, sets an HttpOnly JWT cookie, and returns username + role in the body.
     */
    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates with username/password. On success sets an HttpOnly JWT cookie and returns { username, role } in the body."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Authentication successful — JWT set in HttpOnly cookie",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthenticationResult result = authenticationService.authenticate(
                request.username(),
                request.password()
        );

        if (!result.success()) {
            throw new AuthenticationFailedException("Invalid credentials");
        }

        String token = jwtConfig.generateToken(
                result.username(),
                result.role().name(),
                result.userId()
        );

        AuthResponse response = new AuthResponse(
                result.username(),
                result.role()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieService.createAccessCookie(token).toString())
                .body(response);
    }

    /**
     * Logs out the user by clearing the JWT cookie.
     */
    @PostMapping("/logout")
    @Operation(
            summary = "Logout user",
            description = "Clears the HttpOnly JWT cookie, effectively logging the user out."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Logged out successfully")
    })
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieService.createClearCookie().toString())
                .build();
    }
}
