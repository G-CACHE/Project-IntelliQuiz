package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;
import com.intelliquiz.api.realtime.internal.domain.ports.ViolationRecordRepository;
import com.intelliquiz.api.shared.enums.ViolationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private static final int DEFAULT_AUTO_KICK_THRESHOLD = 0; // 0 = disabled

    private final ViolationRecordRepository violationRecordRepository;

    // Quiz ID -> auto-kick threshold (0 = disabled)
    private final Map<Long, Integer> autoKickThresholds = new ConcurrentHashMap<>();

    // Quiz ID -> { Team ID -> violation count }
    private final Map<Long, Map<Long, Integer>> violationCounts = new ConcurrentHashMap<>();

    // Quiz ID -> Set of kicked team IDs
    private final Map<Long, Set<Long>> kickedTeams = new ConcurrentHashMap<>();

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
    public boolean reportViolation(Long quizId, Long teamId, ViolationType violationType) {
        // Don't track violations for already-kicked teams
        if (isKicked(quizId, teamId)) {
            logger.debug("Ignoring violation for already-kicked team {} in quiz {}", teamId, quizId);
            return false;
        }

        // Persist violation record
        ViolationRecord record = new ViolationRecord(quizId, teamId, violationType);
        violationRecordRepository.save(record);

        // Increment in-memory counter
        int newCount = violationCounts
                .computeIfAbsent(quizId, k -> new ConcurrentHashMap<>())
                .merge(teamId, 1, Integer::sum);

        logger.info("Violation {} reported for team {} in quiz {} (count: {})", violationType, teamId, quizId, newCount);

        // Check auto-kick threshold
        int threshold = getAutoKickThreshold(quizId);
        if (threshold > 0 && newCount >= threshold) {
            kickParticipant(quizId, teamId);
            return true;
        }

        return false;
    }

    /**
     * Manually kicks a participant from the quiz session.
     */
    public void kickParticipant(Long quizId, Long teamId) {
        kickedTeams
                .computeIfAbsent(quizId, k -> ConcurrentHashMap.newKeySet())
                .add(teamId);
        logger.info("Team {} kicked from quiz {}", teamId, quizId);
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
     * Clears all proctoring session data for a quiz (on quiz end).
     */
    public void clearSession(Long quizId) {
        autoKickThresholds.remove(quizId);
        violationCounts.remove(quizId);
        kickedTeams.remove(quizId);
        logger.info("Cleared proctoring session for quiz {}", quizId);
    }
}
