package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;
import com.intelliquiz.api.realtime.internal.domain.ports.ViolationRecordRepository;
import com.intelliquiz.api.shared.enums.ViolationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages proctoring session state: violation tracking, auto-kick thresholds, and manual kicks.
 * Works with in-memory state for real-time tracking and persists violations to the database.
 */
@Service
public class ProctorSessionService {

    private static final Logger logger = LoggerFactory.getLogger(ProctorSessionService.class);
    private static final int DEFAULT_AUTO_KICK_THRESHOLD = 5;

    private final ViolationRecordRepository violationRecordRepository;

    // Quiz ID -> auto-kick threshold (0 = disabled)
    private final Map<Long, Integer> autoKickThresholds = new ConcurrentHashMap<>();

    // Quiz ID -> { Team ID -> violation count }
    private final Map<Long, Map<Long, Integer>> violationCounts = new ConcurrentHashMap<>();

    // Quiz ID -> Set of kicked team IDs
    private final Map<Long, Set<Long>> kickedTeams = new ConcurrentHashMap<>();

    // Quiz ID -> { Team ID -> kick reason }
    private final Map<Long, Map<Long, String>> kickedReasons = new ConcurrentHashMap<>();

    // Quiz ID -> Set of allowed device IDs (for locked quizzes)
    private final Map<Long, Set<String>> allowedDeviceIds = new ConcurrentHashMap<>();

    // Quiz ID -> boolean indicating if quiz entry is locked
    private final Map<Long, Boolean> quizLocked = new ConcurrentHashMap<>();

    // Team ID -> Device ID mapping (for device-based re-entry control)
    private final Map<Long, String> teamToDeviceMapping = new ConcurrentHashMap<>();

    // Quiz ID -> { Device ID -> Team IDs that connected from this device }
    private final Map<Long, Map<String, Set<Long>>> deviceToTeamsMapping = new ConcurrentHashMap<>();

    // Quiz ID -> Set of blacklisted device IDs (for kicked devices)
    private final Map<Long, Set<String>> blacklistedDevices = new ConcurrentHashMap<>();

    public ProctorSessionService(ViolationRecordRepository violationRecordRepository) {
        this.violationRecordRepository = violationRecordRepository;
    }

    /**
     * Sets the auto-kick threshold for a quiz session.
     * When a participant reaches this many violations, they are automatically kicked.
     *
     * @param quizId    the quiz session
     * @param threshold the violation count threshold (0 to disable)
     */
    public void setAutoKickThreshold(Long quizId, int threshold) {
        autoKickThresholds.put(quizId, Math.max(0, threshold));
        logger.info("Auto-kick threshold set to {} for quiz {}", threshold, quizId);
    }

    /**
     * Gets the current auto-kick threshold for a quiz.
     */
    public int getAutoKickThreshold(Long quizId) {
        return autoKickThresholds.getOrDefault(quizId, DEFAULT_AUTO_KICK_THRESHOLD);
    }

    /**
     * Reports a violation for a participant team.
     * Persists the violation, increments the counter, and checks auto-kick threshold.
     *
     * @param quizId        the quiz session
     * @param teamId        the team that committed the violation
     * @param violationType the type of violation
     * @return true if the team should be auto-kicked (threshold reached)
     */
    @Transactional
    public ViolationResult reportViolation(Long quizId, Long teamId, ViolationType violationType) {
        // Don't track violations for already-kicked teams
        if (isKicked(quizId, teamId)) {
            logger.debug("Ignoring violation for already-kicked team {} in quiz {}", teamId, quizId);
            return new ViolationResult(false, false, getViolationCount(quizId, teamId));
        }

        // Persist violation record
        ViolationRecord record = new ViolationRecord(quizId, teamId, violationType);
        violationRecordRepository.save(record);

        boolean countForAutoKick = shouldCountViolation(violationType);

        if (!countForAutoKick) {
            logger.info("Logged non-counting violation {} for team {} in quiz {}", violationType, teamId, quizId);
            return new ViolationResult(true, false, getViolationCount(quizId, teamId));
        }

        // Increment in-memory counter
        int newCount = violationCounts
                .computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
                .merge(teamId, 1, Integer::sum);

        logger.info("Violation {} reported for team {} in quiz {} (count: {})", violationType, teamId, quizId, newCount);

        // Check auto-kick threshold
        int threshold = getAutoKickThreshold(quizId);
        if (threshold > 0 && newCount >= threshold) {
            kickParticipant(quizId, teamId, "Auto-kicked due to violation threshold");
            return new ViolationResult(true, true, newCount);
        }

        return new ViolationResult(true, false, newCount);
    }

    private boolean shouldCountViolation(ViolationType type) {
        return type == ViolationType.TAB_SWITCH || type == ViolationType.COPY_ATTEMPT;
    }

    /**
     * Manually kicks a participant from the quiz session.
     */
    public void kickParticipant(Long quizId, Long teamId) {
        kickParticipant(quizId, teamId, "Kicked by proctor");
    }

    /**
     * Kicks a participant and stores the reason for proctor dashboard recovery.
     */
    public void kickParticipant(Long quizId, Long teamId, String reason) {
        kickedTeams
                .computeIfAbsent(quizId, k -> ConcurrentHashMap.newKeySet())
                .add(teamId);
        kickedReasons
                .computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
                .put(teamId, reason == null || reason.isBlank() ? "Kicked by proctor" : reason);
        logger.info("Team {} kicked from quiz {}", teamId, quizId);
    }

    /**
     * Approves a previously kicked participant to re-enter the quiz.
     *
     * @return true if the participant was kicked and is now approved to re-enter
     */
    public boolean approveReentry(Long quizId, Long teamId) {
        Set<Long> kicked = kickedTeams.get(quizId);
        if (kicked == null) {
            return false;
        }

        boolean removed = kicked.remove(teamId);
        if (removed) {
            Map<Long, String> reasonMap = kickedReasons.get(quizId);
            if (reasonMap != null) {
                reasonMap.remove(teamId);
                if (reasonMap.isEmpty()) {
                    kickedReasons.remove(quizId);
                }
            }

            // Re-entry approval must also clear device blacklist; otherwise access checks still reject join.
            // First try the global teamToDeviceMapping, then fall back to the per-quiz deviceToTeamsMapping.
            String teamDeviceId = teamToDeviceMapping.get(teamId);

            // Also collect any device IDs tracked per-quiz for this team (covers the case where
            // the global mapping was populated but the participant has since disconnected).
            Set<String> devicesFromQuizMap = new java.util.HashSet<>();
            Map<String, Set<Long>> quizDeviceMap = deviceToTeamsMapping.get(quizId);
            if (quizDeviceMap != null) {
                for (Map.Entry<String, Set<Long>> entry : quizDeviceMap.entrySet()) {
                    if (entry.getValue().contains(teamId)) {
                        devicesFromQuizMap.add(entry.getKey());
                    }
                }
            }

            Set<String> blacklisted = blacklistedDevices.get(quizId);
            if (blacklisted != null) {
                if (teamDeviceId != null && !teamDeviceId.isBlank()) {
                    blacklisted.remove(teamDeviceId);
                }
                devicesFromQuizMap.forEach(blacklisted::remove);
                if (blacklisted.isEmpty()) {
                    blacklistedDevices.remove(quizId);
                }
            }

            logger.info("Team {} approved to re-enter quiz {}", teamId, quizId);
        }

        if (kicked.isEmpty()) {
            kickedTeams.remove(quizId);
        }

        return removed;
    }

    /**
     * Checks if a team has been kicked from a quiz.
     */
    public boolean isKicked(Long quizId, Long teamId) {
        Set<Long> kicked = kickedTeams.get(quizId);
        return kicked != null && kicked.contains(teamId);
    }

    /**
     * Gets the violation count for a specific team in a quiz.
     */
    public int getViolationCount(Long quizId, Long teamId) {
        Map<Long, Integer> quizViolations = violationCounts.get(quizId);
        if (quizViolations == null) return 0;
        return quizViolations.getOrDefault(teamId, 0);
    }

    /**
     * Gets all violation counts for a quiz session.
     *
     * @return Map of teamId -> violation count
     */
    public Map<Long, Integer> getAllViolationCounts(Long quizId) {
        return Map.copyOf(violationCounts.getOrDefault(quizId, Map.of()));
    }

    /**
     * Gets all kicked team IDs for a quiz.
     */
    public Set<Long> getKickedTeams(Long quizId) {
        return Set.copyOf(kickedTeams.getOrDefault(quizId, Set.of()));
    }

    /**
     * Gets kick reasons for currently kicked teams in a quiz.
     */
    public Map<Long, String> getKickedTeamReasons(Long quizId) {
        return Map.copyOf(kickedReasons.getOrDefault(quizId, Map.of()));
    }

    /**
     * Gets persisted violation records for a quiz, newest first.
     */
    public List<ViolationRecord> getViolationHistory(Long quizId, Long teamId, Integer limit) {
        List<ViolationRecord> records = teamId == null
                ? violationRecordRepository.findByQuizId(quizId)
                : violationRecordRepository.findByQuizIdAndTeamId(quizId, teamId);

        return records.stream()
                .sorted(Comparator.comparing(ViolationRecord::getDetectedAt).reversed())
                .limit(limit == null || limit < 1 ? Long.MAX_VALUE : limit.longValue())
                .toList();
    }

    /**
     * Clears all proctoring session data for a quiz (on quiz end).
     */
    public void clearSession(Long quizId) {
        autoKickThresholds.remove(quizId);
        violationCounts.remove(quizId);
        kickedTeams.remove(quizId);
        kickedReasons.remove(quizId);
        allowedDeviceIds.remove(quizId);
        quizLocked.remove(quizId);
        deviceToTeamsMapping.remove(quizId);
        blacklistedDevices.remove(quizId);
        logger.info("Cleared proctoring session for quiz {}", quizId);
    }

    // ============================================================================
    // Device-based tracking and quiz entry lock feature (using browser UUIDs)
    // ============================================================================

    /**
     * Registers a team's device ID (browser UUID).
     * This is used for device-based identification and re-entry control.
     *
     * @param teamId the team that connected
     * @param deviceId the browser-based UUID of the device
     */
    public void registerTeamDevice(Long teamId, String deviceId) {
        teamToDeviceMapping.put(teamId, deviceId);
        logger.debug("Registered team {} with device ID {}", teamId, deviceId);
    }

    /**
     * Tracks which device IDs have accessed a quiz.
     * Used for quiz entry lock feature to allow reconnection from same device.
     *
     * @param quizId the quiz
     * @param teamId the team
     * @param deviceId the device UUID
     */
    public void trackDeviceForTeam(Long quizId, Long teamId, String deviceId) {
        deviceToTeamsMapping
                .computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(deviceId, k -> ConcurrentHashMap.newKeySet())
                .add(teamId);
        logger.debug("Tracked device {} for team {} in quiz {}", deviceId, teamId, quizId);
    }

    /**
     * Locks quiz entry for new devices.
     * Only device IDs that are already connected will be allowed to join.
     *
     * @param quizId the quiz to lock
     */
    public void lockQuizEntry(Long quizId) {
        quizLocked.put(quizId, true);
        logger.info("Quiz {} entry locked", quizId);
    }

    /**
     * Unlocks quiz entry to allow new devices.
     *
     * @param quizId the quiz to unlock
     */
    public void unlockQuizEntry(Long quizId) {
        quizLocked.put(quizId, false);
        logger.info("Quiz {} entry unlocked", quizId);
    }

    /**
     * Checks if quiz entry is locked.
     *
     * @param quizId the quiz
     * @return true if locked, false otherwise
     */
    public boolean isQuizLocked(Long quizId) {
        return quizLocked.getOrDefault(quizId, false);
    }

    /**
     * Checks if a device ID is allowed to join a quiz.
     * If quiz is locked, only previously connected device IDs are allowed.
     *
     * @param quizId the quiz
     * @param deviceId the device UUID to check
     * @return true if allowed, false otherwise
     */
    public boolean isDeviceAllowedToJoin(Long quizId, String deviceId) {
        // When the quiz is locked, no device is allowed to join — not even previously connected ones.
        return !isQuizLocked(quizId);
    }

    /**
     * Blacklists a device ID when a team from that device is kicked.
     * This prevents that device from reconnecting (even with proctor approval).
     *
     * @param quizId the quiz
     * @param deviceId the device UUID to blacklist
     */
    public void blacklistDevice(Long quizId, String deviceId) {
        blacklistedDevices
                .computeIfAbsent(quizId, k -> ConcurrentHashMap.newKeySet())
                .add(deviceId);
        logger.info("Blacklisted device {} for quiz {}", deviceId, quizId);
    }

    /**
     * Checks if a device ID is blacklisted for a quiz.
     *
     * @param quizId the quiz
     * @param deviceId the device UUID to check
     * @return true if blacklisted, false otherwise
     */
    public boolean isDeviceBlacklisted(Long quizId, String deviceId) {
        Set<String> blacklisted = blacklistedDevices.get(quizId);
        return blacklisted != null && blacklisted.contains(deviceId);
    }

    /**
     * Gets the device ID registered for a team.
     *
     * @param teamId the team
     * @return the device ID, or null if not registered
     */
    public String getTeamDeviceId(Long teamId) {
        return teamToDeviceMapping.get(teamId);
    }

    /**
     * Gets all connected device IDs for a quiz.
     *
     * @param quizId the quiz
     * @return set of device IDs
     */
    public Set<String> getConnectedDeviceIds(Long quizId) {
        Map<String, Set<Long>> deviceMap = deviceToTeamsMapping.getOrDefault(quizId, Map.of());
        return Set.copyOf(deviceMap.keySet());
    }

    public record ViolationResult(boolean counted, boolean autoKicked, int currentCount) {}
}
