package com.intelliquiz.api.realtime.internal.presentation.controllers;

import com.intelliquiz.api.realtime.internal.application.services.*;
import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;
import com.intelliquiz.api.realtime.internal.presentation.dto.ViolationReportMessage;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.team.TeamFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST Controller for anti-cheat violation reporting.
 * 
 * Replaces WebSocket /app/quiz/{id}/violation endpoint with REST POST.
 * Handles violation reports and auto-kick based on threshold.
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizViolationController {

    private final ProctorSessionService proctorSessionService;
    private final QuizBroadcastService broadcastService;
    private final TeamFacade teamFacade;
    private final QuizFacade quizFacade;

    /**
     * Report a violation (tab switch, focus loss, copy-paste, etc.)
     * 
     * Request: POST /api/quiz/{quizId}/violation
     * Body: { "teamId": "...", "type": "TAB_SWITCH|FOCUS_LOSS|COPY_PASTE", "timestamp": "..." }
     * 
     * Response:
     * - 200 OK: { "status": "recorded", "violationCount": 2, "wasAutoKicked": false }
     * - 200 OK (auto-kicked): { "status": "recorded", "violationCount": 3, "wasAutoKicked": true, "reason": "Threshold exceeded" }
     * - 400 BAD_REQUEST: { "status": "rejected", "message": "Invalid violation type" }
     * - 404 NOT_FOUND: { "status": "rejected", "message": "Team or quiz not found" }
     * 
     * Side effects:
     * - Persists violation to database
     * - Increments violation count for team
     * - Broadcasts violation notification to proctors
     * - If count >= threshold: Auto-kicks team and broadcasts kick notification
     * 
     * @param quizId Quiz identifier
     * @param report Violation report with team, type, timestamp
     * @return Result response with violation count and auto-kick status
     */
    @PostMapping("/{quizId}/violation")
    public ResponseEntity<?> reportViolation(
            @PathVariable Long quizId,
            @RequestParam Long teamId,
            @RequestBody ViolationReportMessage report) {

        log.info("Violation report: quiz={}, team={}, type={}", 
            quizId, teamId, report.type());

        try {
            // Validate violation type
            if (report.type() == null) {
                return ResponseEntity.badRequest().body(new ViolationResponse(
                    "rejected",
                    null,
                    "Invalid violation type"
                ));
            }

            // Record violation in session
            ProctorSessionService.ViolationResult result = proctorSessionService.reportViolation(quizId, teamId, report.type());
            boolean wasAutoKicked = result.autoKicked();
            int violationCount = result.currentCount();

            log.info("Violation recorded: team={}, count={}, type={}", 
                teamId, violationCount, report.type());

            // Get team name for proctor notification
            String teamName = teamFacade.getTeamInfo(teamId)
                    .map(team -> team.name())
                    .orElse("Team " + teamId);

            // Broadcast violation to proctors with team name
            broadcastService.broadcastToProctors(
                quizId,
                com.intelliquiz.api.realtime.internal.presentation.dto.ViolationNotification.create(
                    teamId,
                    teamName,
                    violationCount,
                    report.type(),
                    false
                )
            );

            if (wasAutoKicked) {
                log.warn("Auto-kicking team due to violation threshold: team={}, violations={}", 
                    teamId, violationCount);

                String reason = formatKickReason(teamId, quizId);

                // Broadcast kick notification
                broadcastService.broadcastKick(
                    quizId,
                    new KickNotification(
                        String.valueOf(teamId),
                        reason
                    )
                );
            }

            return ResponseEntity.ok(new ViolationResponse(
                "recorded",
                violationCount,
                wasAutoKicked ?
                    "Team auto-kicked due to violation threshold" : 
                    (result.counted() ? "Violation recorded" : "Violation logged (not counted toward kick threshold)")
            ));

        } catch (NumberFormatException e) {
            log.warn("Invalid quiz/team ID: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ViolationResponse(
                "rejected",
                null,
                "Invalid quiz or team ID"
            ));
        } catch (Exception e) {
            log.error("Error recording violation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ViolationResponse(
                "rejected",
                null,
                "Server error recording violation"
            ));
        }
    }

    /**
     * Manually kick a team (proctor/host action)
     * 
     * Request: POST /api/quiz/{quizId}/kick
     * Body: { "teamId": "...", "reason": "Manual kick by proctor" }
     * 
     * Response: { "status": "kicked", "message": "Team removed from quiz" }
     */
    @PostMapping("/{quizId}/kick")
    public ResponseEntity<?> kickTeam(
            @PathVariable Long quizId,
            @RequestBody KickRequest kickRequest) {

        log.info("Kick request: quiz={}, team={}, reason={}", 
            quizId, kickRequest.teamId(), kickRequest.reason());

        try {
            Long parsedTeamId = Long.parseLong(kickRequest.teamId());

                // Mark team as kicked
                String kickReason = (kickRequest.reason() == null || kickRequest.reason().isBlank())
                    ? "Manual kick by proctor"
                    : kickRequest.reason();
                proctorSessionService.kickParticipant(quizId, parsedTeamId, kickReason);

            // Blacklist the device ID (browser UUID)
            String teamDeviceId = proctorSessionService.getTeamDeviceId(parsedTeamId);
            if (teamDeviceId != null) {
                proctorSessionService.blacklistDevice(quizId, teamDeviceId);
                log.info("Blacklisted device {} for kicked team {} in quiz {}", teamDeviceId, parsedTeamId, quizId);
            }

            String reason = formatKickReason(parsedTeamId, quizId);

            // Broadcast kick notification
            broadcastService.broadcastKick(
                quizId,
                new KickNotification(
                    kickRequest.teamId(),
                    reason
                )
            );

            log.info("Team kicked: quiz={}, team={}", quizId, kickRequest.teamId());

            return ResponseEntity.ok(new KickResponse(
                "kicked",
                "Team removed from quiz"
            ));

        } catch (Exception e) {
            log.error("Error kicking team: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new KickResponse(
                "failed",
                "Server error kicking team"
            ));
        }
    }

    /**
     * Approve re-entry for a previously kicked team.
     *
     * Request: POST /api/quiz/{quizId}/approve-reentry
     * Body: { "teamId": "..." }
     */
    @PostMapping("/{quizId}/approve-reentry")
    public ResponseEntity<?> approveReentry(
            @PathVariable Long quizId,
            @RequestBody ApproveReentryRequest request) {

        try {
            Long parsedTeamId = Long.parseLong(request.teamId());
            boolean approved = proctorSessionService.approveReentry(quizId, parsedTeamId);

            if (!approved) {
                return ResponseEntity.badRequest().body(new ApproveReentryResponse(
                        "not_kicked",
                        "Team is not currently kicked"
                ));
            }

            // Notify the approved team via SSE so their client can reset kicked state and reconnect.
            broadcastService.sendToTeam(
                    quizId,
                    parsedTeamId,
                    com.intelliquiz.api.realtime.internal.presentation.dto.SSEEvent.EventType.REENTRY_APPROVED,
                    Map.of("teamId", String.valueOf(parsedTeamId), "message", "You have been approved to re-enter the quiz")
            );

            return ResponseEntity.ok(new ApproveReentryResponse(
                    "approved",
                    "Team can re-enter the quiz"
            ));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(new ApproveReentryResponse(
                    "failed",
                    "Invalid team ID"
            ));
        } catch (Exception e) {
            log.error("Error approving re-entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApproveReentryResponse(
                    "failed",
                    "Server error approving re-entry"
            ));
        }
    }

    /**
     * Set violation threshold for auto-kick
     * 
     * Request: POST /api/quiz/{quizId}/auto-kick-threshold
     * Body: { "violationCount": 3 }
     */
    @PostMapping("/{quizId}/auto-kick-threshold")
    public ResponseEntity<?> setAutoKickThreshold(
            @PathVariable Long quizId,
            @RequestBody ThresholdRequest thresholdRequest) {

        log.info("Setting auto-kick threshold: quiz={}, threshold={}", 
            quizId, thresholdRequest.violationCount());

        try {
            proctorSessionService.setAutoKickThreshold(quizId, thresholdRequest.violationCount());

            return ResponseEntity.ok(new ThresholdResponse(
                "set",
                thresholdRequest.violationCount(),
                "Auto-kick threshold updated"
            ));

        } catch (Exception e) {
            log.error("Error setting threshold: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ThresholdResponse(
                "failed",
                null,
                "Server error setting threshold"
            ));
        }
    }

    /**
     * Lock quiz entry - only previously connected devices (IPs) can join.
     * New devices will be blocked from entry.
     * 
     * Request: POST /api/quiz/{quizId}/lock
     * Response: { "status": "locked", "message": "Quiz entry locked" }
     */
    @PostMapping("/{quizId}/lock")
    public ResponseEntity<?> lockQuizEntry(@PathVariable Long quizId) {
        log.info("Locking quiz entry: quiz={}", quizId);

        try {
            proctorSessionService.lockQuizEntry(quizId);

            return ResponseEntity.ok(new QuizLockResponse(
                "locked",
                "Quiz entry is now locked. Only previously connected devices can join."
            ));

        } catch (Exception e) {
            log.error("Error locking quiz: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new QuizLockResponse(
                "failed",
                "Server error locking quiz entry"
            ));
        }
    }

    /**
     * Unlock quiz entry - allows new devices to join again.
     * 
     * Request: POST /api/quiz/{quizId}/unlock
     * Response: { "status": "unlocked", "message": "Quiz entry unlocked" }
     */
    @PostMapping("/{quizId}/unlock")
    public ResponseEntity<?> unlockQuizEntry(@PathVariable Long quizId) {
        log.info("Unlocking quiz entry: quiz={}", quizId);

        try {
            proctorSessionService.unlockQuizEntry(quizId);

            return ResponseEntity.ok(new QuizLockResponse(
                "unlocked",
                "Quiz entry is now unlocked. New devices can join."
            ));

        } catch (Exception e) {
            log.error("Error unlocking quiz: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new QuizLockResponse(
                "failed",
                "Server error unlocking quiz entry"
            ));
        }
    }

    /**
     * Get quiz entry lock status and connected device IDs.
     * 
     * Request: GET /api/quiz/{quizId}/lock-status
     * Response: { "isLocked": true, "connectedDeviceIds": ["uuid-1", "uuid-2"] }
     */
    @GetMapping("/{quizId}/lock-status")
    public ResponseEntity<?> getQuizLockStatus(@PathVariable Long quizId) {
        try {
            boolean isLocked = proctorSessionService.isQuizLocked(quizId);
            Set<String> connectedDeviceIds = proctorSessionService.getConnectedDeviceIds(quizId);

            return ResponseEntity.ok(new QuizLockStatusResponse(
                isLocked,
                List.copyOf(connectedDeviceIds)
            ));

        } catch (Exception e) {
            log.error("Error getting quiz lock status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", "Server error getting lock status")
            );
        }
    }

    /**
     * Get persisted violation history for a quiz.
     *
     * Request: GET /api/quiz/{quizId}/violations?teamId=123&limit=200
     */
    @GetMapping("/{quizId}/violations")
    public ResponseEntity<?> getViolationHistory(
            @PathVariable Long quizId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false, defaultValue = "200") Integer limit) {
        try {
            int safeLimit = Math.max(1, Math.min(limit == null ? 200 : limit, 1000));
            List<ViolationRecord> records = proctorSessionService.getViolationHistory(quizId, teamId, safeLimit);

            Map<Long, String> teamNameById = new HashMap<>();
            List<ViolationHistoryItem> response = records.stream()
                    .map(record -> {
                        String teamName = teamNameById.computeIfAbsent(
                                record.getTeamId(),
                                id -> teamFacade.getTeamInfo(id)
                                        .map(team -> team.name())
                                        .orElse("Team " + id)
                        );
                        return new ViolationHistoryItem(
                                record.getId(),
                                record.getQuizId(),
                                record.getTeamId(),
                                teamName,
                                record.getViolationType().name(),
                                record.getDetectedAt()
                        );
                    })
                    .toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting violation history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("error", "Server error getting violation history")
            );
        }
    }

    // Response DTOs
    public record ViolationResponse(String status, Integer violationCount, String message) {}
    public record KickRequest(String teamId, String reason) {}
    public record KickResponse(String status, String message) {}
    public record ApproveReentryRequest(String teamId) {}
    public record ApproveReentryResponse(String status, String message) {}
    public record KickNotification(String teamId, String reason) {}
    public record ViolationNotification(String teamId, String type, LocalDateTime timestamp, Integer count) {}
    public record ThresholdRequest(Integer violationCount) {}
    public record ThresholdResponse(String status, Integer threshold, String message) {}
    public record QuizLockResponse(String status, String message) {}
    public record QuizLockStatusResponse(boolean isLocked, List<String> connectedDeviceIds) {}
        public record ViolationHistoryItem(
            Long id,
            Long quizId,
            Long teamId,
            String teamName,
            String violationType,
            LocalDateTime detectedAt
        ) {}

    private String formatKickReason(Long teamId, Long quizId) {
        String teamName = teamFacade.getTeamInfo(teamId)
                .map(t -> t.name() != null && !t.name().isBlank() ? t.name() : "User")
                .orElse("User");
        String quizTitle = quizFacade.findQuizInfo(quizId)
                .map(q -> q.title() != null && !q.title().isBlank() ? q.title() : "quiz")
                .orElse("quiz");
        return teamName + " is kicked from the " + quizTitle + ". Contact your administrator for more details.";
    }
}
