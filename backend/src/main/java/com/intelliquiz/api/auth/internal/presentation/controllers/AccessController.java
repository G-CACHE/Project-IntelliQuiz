package com.intelliquiz.api.auth.internal.presentation.controllers;

import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.auth.internal.presentation.dto.request.AccessCodeRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.request.PublicJoinRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.request.UpdateTeamNameRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.response.AccessResolutionResponse;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.realtime.internal.application.services.ProctorSessionService;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
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
import org.springframework.beans.factory.annotation.Autowired;
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
        private final ProctorSessionService proctorSessionService;
    

        @Autowired
        public AccessController(AccessResolutionService accessResolutionService,
                            TeamFacade teamFacade,
                                                        QuizFacade quizFacade,
                                                        ProctorSessionService proctorSessionService) {
        this.accessResolutionService = accessResolutionService;
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
                this.proctorSessionService = proctorSessionService;
    }

        // Backward-compatible constructor for direct instantiation in tests.
        public AccessController(AccessResolutionService accessResolutionService,
                                                        TeamFacade teamFacade,
                                                        QuizFacade quizFacade) {
                this(accessResolutionService, teamFacade, quizFacade, null);
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
        String normalizedDeviceId = request.deviceId() != null ? request.deviceId().trim() : null;
        
        AccessResolutionResponse response = switch (result.routeType()) {
            case PARTICIPANT -> {
                                TeamInfoDto team = result.teamId() != null
                                                ? teamFacade.getTeamInfo(result.teamId()).orElse(null)
                                                : null;
                QuizInfoDto quiz = quizFacade.findQuizInfo(result.quizId()).orElse(null);

                if (quiz != null
                        && proctorSessionService != null
                        && proctorSessionService.isQuizLocked(result.quizId())) {
                    boolean hasDeviceId = normalizedDeviceId != null && !normalizedDeviceId.isBlank();
                    // A device is allowed through the lock only if it was already connected
                    // when the host pressed Lock — i.e. it appears in the allowed-devices snapshot.
                    boolean allowedLockedDevice = hasDeviceId
                            && proctorSessionService.isDeviceAllowedToJoin(result.quizId(), normalizedDeviceId);

                    if (!allowedLockedDevice) {
                        yield AccessResolutionResponse.invalid(
                                "This quiz is locked and not accepting new entries. Contact the administrator for help."
                        );
                    }
                }

                if (team == null
                        && quiz != null
                        && quiz.accessMode() == QuizAccessMode.PUBLIC
                        && normalizedDeviceId != null
                        && !normalizedDeviceId.isBlank()) {
                    team = teamFacade.getTeamByQuizAndDeviceId(result.quizId(), normalizedDeviceId)
                            .orElse(null);
                }

                yield AccessResolutionResponse.participant(
                        team != null ? new AccessResolutionResponse.TeamResponse(
                                team.id(), team.name(), team.accessCode(), team.totalScore(), team.quizId()
                        ) : null,
                        quiz != null ? new AccessResolutionResponse.QuizAccessResponse(
                                quiz.id(), quiz.title(), quiz.quizCode(), quiz.proctorPin(), quiz.isLive(), quiz.status(), quiz.accessMode()
                        ) : null
                );
            }
            case HOST -> {
                QuizInfoDto quiz = quizFacade.findQuizInfo(result.quizId()).orElse(null);
                if (quiz == null) {
                    yield AccessResolutionResponse.invalid("Quiz not found");
                }

                if (quiz.status() == QuizStatus.DRAFT) {
                    yield AccessResolutionResponse.invalid("Proctoring is not allowed while quiz is in draft");
                }

                yield AccessResolutionResponse.host(
                        new AccessResolutionResponse.QuizAccessResponse(
                                quiz.id(), quiz.title(), quiz.quizCode(), quiz.proctorPin(), quiz.isLive(), quiz.status(), quiz.accessMode()
                        )
                );
            }
            case INVALID -> AccessResolutionResponse.invalid(result.errorMessage());
        };
        
        return ResponseEntity.ok(response);
    }

    /**
     * Public-mode participant join endpoint.
     *
     * Accepts a participant/team display name and creates (or reuses) a team for the given quiz.
     * Quiz must be in PUBLIC access mode and currently READY or ACTIVE.
     */
    @PostMapping("/quizzes/{quizId}/join")
    @Operation(
            summary = "Join a public quiz",
            description = "Creates or reuses a team for a PUBLIC quiz and returns a participant access response."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Joined quiz successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AccessResolutionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or quiz not joinable",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<AccessResolutionResponse> joinPublicQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody PublicJoinRequest request) {

        QuizInfoDto quiz = quizFacade.findQuizInfo(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        if (quiz.accessMode() != QuizAccessMode.PUBLIC) {
            throw new IllegalArgumentException("This quiz is restricted and requires a team access code");
        }

        if (!(quiz.isLive() || quiz.status() == QuizStatus.READY)) {
            throw new IllegalArgumentException("Quiz session is not active");
        }

        String normalizedDeviceId = request.deviceId() != null ? request.deviceId().trim() : null;

        if (proctorSessionService != null && proctorSessionService.isQuizLocked(quizId)) {
            boolean allowed = normalizedDeviceId != null
                    && !normalizedDeviceId.isBlank()
                    && proctorSessionService.isDeviceAllowedToJoin(quizId, normalizedDeviceId);
            if (!allowed) {
                throw new IllegalArgumentException("This quiz is locked and not accepting new entries. Contact the administrator for help.");
            }
        }

        TeamInfoDto existingByDevice = (normalizedDeviceId != null && !normalizedDeviceId.isBlank())
                ? teamFacade.getTeamByQuizAndDeviceId(quizId, normalizedDeviceId).orElse(null)
                : null;

        TeamInfoDto existingByName = teamFacade.getTeamsByQuiz(quizId).stream()
                .filter(t -> t.name() != null && t.name().equalsIgnoreCase(request.name().trim()))
                .findFirst()
                .orElse(null);

        TeamInfoDto resolvedTeam;
        if (existingByDevice != null) {
            resolvedTeam = existingByDevice;
        } else if (existingByName != null) {
            resolvedTeam = existingByName;
        } else {
                        resolvedTeam = teamFacade.registerTeam(quizId, request.name().trim());
                }

                if (normalizedDeviceId != null && !normalizedDeviceId.isBlank()) {
                        teamFacade.bindDeviceId(resolvedTeam.id(), normalizedDeviceId);
                }

                if (proctorSessionService != null && proctorSessionService.isKicked(quizId, resolvedTeam.id())) {
                        throw new IllegalArgumentException("You are not allowed to join this quiz yet. Please contact your proctor, admin, or examiner for re-entry approval.");
        }

        AccessResolutionResponse response = AccessResolutionResponse.participant(
                new AccessResolutionResponse.TeamResponse(
                        resolvedTeam.id(),
                        resolvedTeam.name(),
                        resolvedTeam.accessCode(),
                        resolvedTeam.totalScore(),
                        resolvedTeam.quizId()
                ),
                new AccessResolutionResponse.QuizAccessResponse(
                        quiz.id(),
                        quiz.title(),
                        quiz.quizCode(),
                        quiz.proctorPin(),
                        quiz.isLive(),
                        quiz.status(),
                        quiz.accessMode()
                )
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Updates a team's name (used for setting avatars).
     * Requires the team's access code for verification.
     */
    @PutMapping("/teams/{teamId}/name")
    @Operation(
            summary = "Update team name",
            description = "Updates a team's name. Requires the team's access code for verification. Useful for setting avatars in names."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Name updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or access code"),
            @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<Void> updateTeamName(
            @PathVariable Long teamId,
            @Valid @RequestBody UpdateTeamNameRequest request) {
        
        teamFacade.updateTeamNameWithAccessCode(teamId, request.name(), request.accessCode());
        return ResponseEntity.ok().build();
    }
}
