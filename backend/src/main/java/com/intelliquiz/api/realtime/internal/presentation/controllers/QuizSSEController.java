package com.intelliquiz.api.realtime.internal.presentation.controllers;

import com.intelliquiz.api.realtime.internal.application.services.*;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.infrastructure.config.SSEConnectionRegistry;
import com.intelliquiz.api.realtime.internal.presentation.dto.SSEEvent;
import com.intelliquiz.api.realtime.internal.presentation.dto.TeamConnectionMessage;
import com.intelliquiz.api.realtime.internal.presentation.dto.QuestionPayload;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.shared.enums.QuizStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * REST Controller for Server-Sent Events (SSE) streaming.
 * 
 * Replaces WebSocket connectivity with unidirectional HTTP streaming.
 * Clients establish long-lived SSE connection via EventSource API.
 * Server sends events as: data: {json}\n\n
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizSSEController {

    private final SSEConnectionRegistry sseRegistry;
    private final QuizSessionManager quizSessionManager;
    private final QuizTimerService timerService;
    private final QuizFacade quizFacade;
    private final QuizBroadcastService quizBroadcastService;
    private final TeamFacade teamFacade;
    private final ProctorSessionService proctorSessionService;

    public record ParticipantAccessCheckResponse(boolean allowed, String message) {}

    /**
     * Establishes Server-Sent Events (SSE) connection for a quiz.
     * 
     * Client connects via:
     *   const eventSource = new EventSource('/api/quiz/{quizId}/stream?role=PARTICIPANT&teamId=xyz&deviceId=...')
     * 
     * Server immediately returns:
     * 1. Current game state (for reconnection recovery)
     * 2. Keeps connection alive with periodic SSE events
     * 3. Closes when quiz ends or timeout occurs (5 minutes default)
     * 
     * @param quizId       Quiz identifier
     * @param role         Client role: PARTICIPANT, HOST, or PROCTOR
     * @param teamId       Team ID (required for PARTICIPANT, optional for HOST/PROCTOR)
     * @param deviceId     Browser-based UUID for device identification (sticky session)
     * @param accessCode   Access code for authentication (host PIN or team access code)
     * @return SseEmitter for streaming, or 404/403 if invalid
     */
    @GetMapping("/{quizId}/stream")
    public SseEmitter subscribe(
            @PathVariable Long quizId,
            @RequestParam String role,
            @RequestParam(required = false) String teamId,
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String accessCode) {

        // Validate and use device ID (or generate one if not provided)
        String validatedDeviceId = deviceId != null && !deviceId.isBlank() ? deviceId : UUID.randomUUID().toString();
        log.info("SSE subscription request: quiz={}, role={}, team={}, device={}", quizId, role, teamId, validatedDeviceId);

        // Validate quiz exists
        // Note: Real implementation would check via QuizFacade or repository
        if (quizId == null || !quizFacade.quizExists(quizId)) {
            throw new IllegalArgumentException("Invalid quiz ID");
        }

        var quizInfo = quizFacade.findQuizInfo(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        boolean participantJoinableForRealtime = quizInfo.status() == QuizStatus.READY || quizInfo.isLive();

        if ("PARTICIPANT".equalsIgnoreCase(role)) {
            ParticipantAccessCheckResponse access = validateParticipantRealtimeAccess(quizId, teamId, validatedDeviceId, participantJoinableForRealtime);
            if (!access.allowed()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, access.message());
            }
        }

        if ("PROCTOR".equalsIgnoreCase(role) || "HOST".equalsIgnoreCase(role)) {
            if (quizInfo.status() == QuizStatus.DRAFT) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Proctoring is not available for this quiz state");
            }
        }

        // Generate unique session ID
        String sessionId = UUID.randomUUID().toString();

        try {
            // Create SseEmitter with 5 minute timeout
            SseEmitter emitter = new SseEmitter(300000L);

            // Register in SSE registry with device ID
            sseRegistry.register(String.valueOf(quizId), sessionId, role, teamId, validatedDeviceId, emitter);

            // Get current game state
            GameState currentState = quizSessionManager.getCurrentState(quizId);
            if (("PROCTOR".equalsIgnoreCase(role) || "HOST".equalsIgnoreCase(role)) && quizInfo.status() == QuizStatus.ARCHIVED) {
                // Archived quizzes should reconnect directly to final results.
                currentState = GameState.ENDED;
            }
            Integer currentQuestionIndex = quizSessionManager.getCurrentQuestionIndex(quizId);

            // Build and send initial state message
            SSEEvent initialStateEvent = SSEEvent.create(
                SSEEvent.EventType.GAME_STATE,
                buildGameStatePayload(quizId, currentState, currentQuestionIndex)
            );

            emitter.send(SseEmitter.event()
                .id(initialStateEvent.getEventId())
                .name("GAME_STATE")
                .data(initialStateEvent.getData())
                .reconnectTime(3000));

            if (("PROCTOR".equalsIgnoreCase(role) || "HOST".equalsIgnoreCase(role)) && quizInfo.status() == QuizStatus.ARCHIVED) {
                // Also provide final rankings snapshot for archived sessions so the final page can render immediately.
                sendArchivedScoreboardSnapshot(quizId, emitter);
            }

            // Backfill currently connected teams for late subscribers (e.g., proctor connects after participants).
            sendConnectedTeamsSnapshot(quizId, emitter);

            // Notify all clients that a team has joined (if participant)
            if ("PARTICIPANT".equals(role) && teamId != null && !teamId.isEmpty()) {
                try {
                    Long parsedTeamId = Long.parseLong(teamId);
                    // Track device connection for this team
                    proctorSessionService.registerTeamDevice(parsedTeamId, validatedDeviceId);
                    proctorSessionService.trackDeviceForTeam(quizId, parsedTeamId, validatedDeviceId);
                    quizBroadcastService.notifyTeamJoined(quizId, parsedTeamId);
                } catch (NumberFormatException e) {
                    log.warn("Invalid teamId format: {}", teamId);
                }
            }

            log.info("SSE connection established: session={}, quiz={}, device={}", sessionId, quizId, validatedDeviceId);

            return emitter;

        } catch (IOException e) {
            log.error("Failed to send initial SSE event for quiz {}: {}", quizId, e.getMessage());
            throw new RuntimeException("Failed to establish SSE connection", e);
        }
    }

    /**
     * Explicit participant re-entry eligibility check used by login/lobby guards.
     */
    @GetMapping("/{quizId}/participant-access")
    public ResponseEntity<ParticipantAccessCheckResponse> checkParticipantAccess(
            @PathVariable Long quizId,
            @RequestParam String teamId,
            @RequestParam(required = false) String deviceId) {

        String validatedDeviceId = deviceId != null && !deviceId.isBlank() ? deviceId : UUID.randomUUID().toString();

        if (quizId == null || !quizFacade.quizExists(quizId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ParticipantAccessCheckResponse(false, "Quiz not found"));
        }

        var quizInfo = quizFacade.findQuizInfo(quizId)
                .orElse(null);
        if (quizInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ParticipantAccessCheckResponse(false, "Quiz not found"));
        }

        boolean joinableForRealtime = quizInfo.status() == QuizStatus.READY || quizInfo.isLive();
        ParticipantAccessCheckResponse access = validateParticipantRealtimeAccess(quizId, teamId, validatedDeviceId, joinableForRealtime);

        if (!access.allowed()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(access);
        }
        return ResponseEntity.ok(access);
    }

    /**
     * Returns current quiz status for polling or reconnection recovery.
     * 
     * Useful as fallback if SSE connection fails, or for explicit polling.
     * 
     * @param quizId Quiz identifier
     * @return Current game state and question info
     */
    @GetMapping("/{quizId}/status")
    public ResponseEntity<?> getStatus(@PathVariable Long quizId) {
        try {
            GameState state = quizSessionManager.getCurrentState(quizId);
            Integer questionIndex = quizSessionManager.getCurrentQuestionIndex(quizId);
            
            return ResponseEntity.ok(buildGameStatePayload(quizId, state, questionIndex));
        } catch (Exception e) {
            log.error("Error getting quiz status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Returns a recoverable proctor snapshot so dashboard panels are populated
     * even when opened after realtime events already happened.
     */
    @GetMapping("/{quizId}/proctor-snapshot")
    public ResponseEntity<?> getProctorSnapshot(@PathVariable Long quizId) {
        try {
            String quizKey = String.valueOf(quizId);

            List<SnapshotConnectedTeam> connected = new ArrayList<>();
            for (String connectedTeamId : sseRegistry.getConnectedTeams(quizKey)) {
                try {
                    Long teamId = Long.parseLong(connectedTeamId);
                    String teamName = teamFacade.getTeamInfo(teamId)
                            .map(team -> team.name())
                            .orElse("Team " + connectedTeamId);
                    connected.add(new SnapshotConnectedTeam(teamId, teamName, Instant.now().toString()));
                } catch (NumberFormatException ignored) {
                    // Skip malformed identifiers.
                }
            }

            Map<Long, String> reasons = proctorSessionService.getKickedTeamReasons(quizId);
            List<SnapshotKickedTeam> kicked = proctorSessionService.getKickedTeams(quizId).stream()
                    .map(teamId -> {
                        String teamName = teamFacade.getTeamInfo(teamId)
                                .map(team -> team.name())
                                .orElse("Team " + teamId);
                        String reason = reasons.getOrDefault(teamId, "Removed from this quiz");
                        return new SnapshotKickedTeam(teamId, teamName, reason, Instant.now().toString());
                    })
                    .sorted(Comparator.comparing(SnapshotKickedTeam::id))
                    .toList();

            return ResponseEntity.ok(new ProctorSnapshotResponse(connected, kicked));
        } catch (Exception e) {
            log.error("Error getting proctor snapshot for quiz {}: {}", quizId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error retrieving proctor snapshot"));
        }
    }

    /**
     * Internal helper to build game state payload for SSE event
     */
    private Object buildGameStatePayload(Long quizId, GameState gameState, Integer questionIndex) {
        int safeQuestionIndex = questionIndex != null ? questionIndex : -1;
        String serializedState = gameState != null ? gameState.toString() : "UNKNOWN";
        int payloadTimeRemaining = timerService.getRemainingSeconds(quizId);

        java.util.List<QuestionInfoDto> orderedQuestions = getSessionOrderedQuestions(quizId);
        int payloadTotalQuestions = orderedQuestions.size();

        QuestionPayload resolvedByQuestionId = quizSessionManager.getCurrentQuestionId(quizId)
                .flatMap(currentQuestionId -> orderedQuestions.stream()
                        .filter(q -> currentQuestionId.equals(q.id()))
                        .findFirst())
                .map(QuestionPayload::fromDto)
                .orElse(null);

        final QuestionPayload currentQuestionPayload =
            resolvedByQuestionId != null
                ? resolvedByQuestionId
                : (safeQuestionIndex >= 0 && safeQuestionIndex < payloadTotalQuestions)
                ? QuestionPayload.fromDto(orderedQuestions.get(safeQuestionIndex))
                : null;

        // Calculate current rankings for the initial snapshot
        List<com.intelliquiz.api.team.dto.TeamInfoDto> leaderboard = teamFacade.getTeamsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(com.intelliquiz.api.team.dto.TeamInfoDto::totalScore).reversed())
                .toList();

        List<Object> rankings = new ArrayList<>();
        int rank = 1;
        for (com.intelliquiz.api.team.dto.TeamInfoDto team : leaderboard) {
            final int itemRank = rank++;
            rankings.add(new Object() {
                public final Long teamId = team.id();
                public final String teamName = team.name();
                public final Integer totalScore = team.totalScore();
                public final Integer score = team.totalScore();
                public final Integer rank = itemRank;
            });
        }

        return new Object() {
            public final String state = serializedState;
            public final String gameState = serializedState;
            public final Integer currentQuestionIndex = safeQuestionIndex;
            public final Integer totalQuestions = payloadTotalQuestions;
            public final Integer timeRemaining = payloadTimeRemaining;
            public final QuestionPayload currentQuestion = currentQuestionPayload;
            public final Boolean participantNavigationEnabled = quizSessionManager.isParticipantNavigationEnabled(quizId);
            public final Boolean timerActive = timerService.isTimerActive(quizId);
            public final java.util.List<Object> teamResults = rankings;
            public final java.util.List<Object> rankingsData = rankings;
            public final java.time.LocalDateTime timestamp = java.time.LocalDateTime.now();
        };
    }

    private List<QuestionInfoDto> getSessionOrderedQuestions(Long quizId) {
        List<QuestionInfoDto> orderedQuestions = quizFacade.getOrderedQuestions(quizId);
        NavigationMode mode = quizSessionManager.getNavigationMode(quizId);
        if (mode != NavigationMode.TOURNAMENT) {
            return orderedQuestions;
        }

        return orderedQuestions.stream()
                .sorted(Comparator
                        .comparingInt((QuestionInfoDto q) -> difficultyPriority(q.difficulty()))
                        .thenComparingInt(QuestionInfoDto::orderIndex))
                .toList();
    }

    private int difficultyPriority(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return 3;
        }

        try {
            Difficulty diff = Difficulty.valueOf(difficulty.trim().toUpperCase());
            return switch (diff) {
                case EASY -> 0;
                case MEDIUM -> 1;
                case HARD -> 2;
                default -> 3;
            };
        } catch (IllegalArgumentException ex) {
            return 3;
        }
    }

    private ParticipantAccessCheckResponse validateParticipantRealtimeAccess(
            Long quizId,
            String teamId,
            String validatedDeviceId,
            boolean joinableForRealtime
    ) {
        if (!joinableForRealtime) {
            return new ParticipantAccessCheckResponse(false, "Participants can connect only when quiz is READY or ACTIVE");
        }
        if (teamId == null || teamId.isBlank()) {
            return new ParticipantAccessCheckResponse(false, "teamId is required for PARTICIPANT stream");
        }

        Long parsedTeamId;
        try {
            parsedTeamId = Long.parseLong(teamId);
        } catch (NumberFormatException ex) {
            return new ParticipantAccessCheckResponse(false, "Invalid teamId format");
        }

        var teamInfo = teamFacade.getTeamInfo(parsedTeamId).orElse(null);
        if (teamInfo == null) {
            return new ParticipantAccessCheckResponse(false, "Team not found");
        }
        if (!quizId.equals(teamInfo.quizId())) {
            return new ParticipantAccessCheckResponse(false, "Team does not belong to this quiz");
        }

        if (proctorSessionService.isDeviceBlacklisted(quizId, validatedDeviceId)) {
            return new ParticipantAccessCheckResponse(false, "You were removed from this quiz and cannot rejoin from this device. Please contact the proctor/admin for approval.");
        }

        if (proctorSessionService.isQuizLocked(quizId)
                && !proctorSessionService.isDeviceAllowedToJoin(quizId, validatedDeviceId)) {
            return new ParticipantAccessCheckResponse(false, "Quiz entry is locked. Please contact the proctor/admin for access.");
        }

        if (proctorSessionService.isKicked(quizId, parsedTeamId)) {
            return new ParticipantAccessCheckResponse(false, "You were removed from this quiz. You cannot rejoin until approved by the proctor/admin.");
        }

        return new ParticipantAccessCheckResponse(true, "Allowed");
    }

    private void sendConnectedTeamsSnapshot(Long quizId, SseEmitter emitter) throws IOException {
        Set<String> connectedTeamIds = sseRegistry.getConnectedTeams(String.valueOf(quizId));
        for (String connectedTeamId : connectedTeamIds) {
            Long connectedTeamIdLong;
            try {
                connectedTeamIdLong = Long.parseLong(connectedTeamId);
            } catch (NumberFormatException ignored) {
                continue;
            }

            String teamName = teamFacade.getTeamInfo(connectedTeamIdLong)
                    .map(team -> team.name())
                    .orElse("Team " + connectedTeamId);

            TeamConnectionMessage teamConnected = new TeamConnectionMessage(
                    "TEAM_CONNECTED",
                    connectedTeamIdLong,
                    teamName,
                    Instant.now().toString()
            );

            SSEEvent event = SSEEvent.create(SSEEvent.EventType.TEAM_JOINED, teamConnected);
            emitter.send(SseEmitter.event()
                    .id(event.getEventId())
                    .name("TEAM_JOINED")
                    .data(event.getData())
                    .reconnectTime(3000));
        }
    }

    private void sendArchivedScoreboardSnapshot(Long quizId, SseEmitter emitter) throws IOException {
        List<com.intelliquiz.api.team.dto.TeamInfoDto> leaderboard = teamFacade.getTeamsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(com.intelliquiz.api.team.dto.TeamInfoDto::totalScore).reversed())
                .toList();
        List<Object> payload = new ArrayList<>();

        int rank = 1;
        for (com.intelliquiz.api.team.dto.TeamInfoDto team : leaderboard) {
            final int itemRank = rank++;
            payload.add(new Object() {
                public final Long teamId = team.id();
                public final String teamName = team.name();
                public final Integer totalScore = team.totalScore();
                public final Integer score = team.totalScore();
                public final Integer rank = itemRank;
            });
        }

        SSEEvent event = SSEEvent.create(SSEEvent.EventType.GAME_STATE, payload);
        emitter.send(SseEmitter.event()
                .id(event.getEventId())
                .name("GAME_STATE")
                .data(event.getData())
                .reconnectTime(3000));
    }

    public record SnapshotConnectedTeam(Long id, String name, String connectedAt) {}

    public record SnapshotKickedTeam(Long id, String name, String reason, String kickedAt) {}

    public record ProctorSnapshotResponse(List<SnapshotConnectedTeam> connectedTeams, List<SnapshotKickedTeam> kickedTeams) {}
}

