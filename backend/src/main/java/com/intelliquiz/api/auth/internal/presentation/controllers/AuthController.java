package com.intelliquiz.api.auth.internal.presentation.controllers;

import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
import com.intelliquiz.api.shared.exceptions.AuthenticationFailedException;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication.
 * Public endpoint - no authentication required.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User login and JWT token generation. Public endpoint - no authentication required.")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final JwtConfig jwtConfig;

    public AuthController(AuthenticationService authenticationService, JwtConfig jwtConfig) {
        this.authenticationService = authenticationService;
        this.jwtConfig = jwtConfig;
    }

    /**
     * Authenticates a user and returns a JWT token.
     * Uses generic error messages to avoid revealing which credential was incorrect.
     */
    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates a user with username and password credentials and returns a JWT token for subsequent API calls. Uses generic error messages to avoid revealing which credential was incorrect."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Authentication successful",
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
                result.role().name()
        );
        
        AuthResponse response = new AuthResponse(
                token,
                result.username(),
                result.role()
        );
        
        return ResponseEntity.ok(response);
    }
}
