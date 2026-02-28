package com.intelliquiz.api.auth.internal.presentation.controllers;

import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.auth.internal.presentation.dto.request.AccessCodeRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.response.AccessResolutionResponse;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.shared.dto.ErrorResponse;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
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
    private final TeamFacade teamFacade;
    private final QuizFacade quizFacade;

    public AccessController(AccessResolutionService accessResolutionService,
                            TeamFacade teamFacade,
                            QuizFacade quizFacade) {
        this.accessResolutionService = accessResolutionService;
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
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
            case PARTICIPANT -> {
                TeamInfoDto team = teamFacade.getTeamInfo(result.teamId()).orElse(null);
                yield AccessResolutionResponse.participant(
                        result.teamId(),
                        team != null ? team.name() : null,
                        result.quizId()
                );
            }
            case HOST -> {
                QuizInfoDto quiz = quizFacade.findQuizInfo(result.quizId()).orElse(null);
                yield AccessResolutionResponse.host(
                        result.quizId(),
                        quiz != null ? quiz.title() : null
                );
            }
            case INVALID -> AccessResolutionResponse.invalid(result.errorMessage());
        };
        
        return ResponseEntity.ok(response);
    }
}
