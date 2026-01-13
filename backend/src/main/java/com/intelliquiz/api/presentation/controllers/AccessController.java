package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.services.AccessResolutionResult;
import com.intelliquiz.api.application.services.AccessResolutionService;
import com.intelliquiz.api.application.services.RouteType;
import com.intelliquiz.api.presentation.dto.request.AccessCodeRequest;
import com.intelliquiz.api.presentation.dto.response.AccessResolutionResponse;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.QuizResponse;
import com.intelliquiz.api.presentation.dto.response.TeamResponse;
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
 * REST controller for access code resolution.
 * Public endpoint - no authentication required.
 */
@RestController
@RequestMapping("/api/access")
@Tag(name = "Access", description = "Access code resolution for participants and hosts. Public endpoint - no authentication required.")
public class AccessController {

    private final AccessResolutionService accessResolutionService;

    public AccessController(AccessResolutionService accessResolutionService) {
        this.accessResolutionService = accessResolutionService;
    }

    /**
     * Resolves an access code to determine the appropriate route.
     * Returns PARTICIPANT route for team codes, HOST route for proctor PINs,
     * or INVALID route for unrecognized codes.
     */
    @PostMapping("/resolve")
    @Operation(
            summary = "Resolve access code",
            description = "Resolves an access code to determine the appropriate route. Returns PARTICIPANT route for team codes, HOST route for proctor PINs, or INVALID route for unrecognized codes."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Access code resolved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AccessResolutionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<AccessResolutionResponse> resolveAccessCode(
            @Valid @RequestBody AccessCodeRequest request) {
        
        AccessResolutionResult result = accessResolutionService.resolve(request.code());
        
        AccessResolutionResponse response = switch (result.routeType()) {
            case PARTICIPANT -> AccessResolutionResponse.participant(
                    TeamResponse.from(result.team())
            );
            case HOST -> AccessResolutionResponse.host(
                    QuizResponse.from(result.quiz())
            );
            case INVALID -> AccessResolutionResponse.invalid(result.errorMessage());
        };
        
        return ResponseEntity.ok(response);
    }
}
