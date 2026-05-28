package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.realtime.internal.application.services.ProctorSessionService;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Application service for resolving access codes at the universal gate.
 * Uses TeamFacade and QuizFacade — no direct entity/repository access.
 */
@Service
public class AccessResolutionService {

    private static final Logger logger = LoggerFactory.getLogger(AccessResolutionService.class);

    private final TeamFacade teamFacade;
    private final QuizFacade quizFacade;
    private final ProctorSessionService proctorSessionService;

    @Autowired
    public AccessResolutionService(TeamFacade teamFacade,
                                   QuizFacade quizFacade,
                                   ProctorSessionService proctorSessionService) {
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
        this.proctorSessionService = proctorSessionService;
    }

    // Backward-compatible constructor for direct instantiation in tests.
    public AccessResolutionService(TeamFacade teamFacade, QuizFacade quizFacade) {
        this(teamFacade, quizFacade, null);
    }

    /**
     * Resolves an access code to determine the appropriate route.
     *
     * Resolution order:
     * 1. Check if code matches a team access code -> PARTICIPANT route (if quiz is active or READY)
     * 2. Check if code matches a proctor PIN for any quiz -> HOST route
    * 3. Check if code matches a public quiz join code (6 alphanumeric chars) -> PARTICIPANT pre-join route
    * 4. Otherwise -> INVALID route
     */
    public AccessResolutionResult resolve(String accessCode) {
        if (accessCode == null || accessCode.isBlank()) {
            return AccessResolutionResult.invalid("Access code is required");
        }

        String normalizedCode = accessCode.trim().toUpperCase();
        logger.debug("Resolving access code: {}", normalizedCode);

        // First, check if it's a team access code
        Optional<TeamInfoDto> team = teamFacade.getTeamByAccessCode(normalizedCode);
        if (team.isPresent()) {
            Long quizId = team.get().quizId();
            Optional<QuizInfoDto> quiz = quizFacade.findQuizInfo(quizId);
            if (quiz.isPresent()) {
                QuizInfoDto q = quiz.get();
                if (proctorSessionService != null && proctorSessionService.isKicked(quizId, team.get().id())) {
                    logger.info("Access code {} rejected: team {} is kicked and pending proctor approval", normalizedCode, team.get().id());
                    return AccessResolutionResult.invalid("You are not allowed to join this quiz yet. Please contact your proctor, admin, or examiner for re-entry approval.");
                }
                // Allow participants to join lobby (READY) or active (live) sessions
                if (q.isLive() || q.status() == QuizStatus.READY) {
                    logger.info("Access code {} resolved to PARTICIPANT for team {} in quiz {}",
                            normalizedCode, team.get().id(), quizId);
                    return AccessResolutionResult.participant(team.get().id(), quizId);
                }
            }
            logger.info("Access code {} rejected: Quiz session is not active", normalizedCode);
            return AccessResolutionResult.invalid("Quiz session is not active");
        }

        // Second, check if it's a proctor PIN for any quiz.
        // DRAFT quizzes cannot be proctored yet.
        // READY/ACTIVE/ARCHIVED quizzes are allowed for host access.
        for (QuizInfoDto quiz : quizFacade.findAllQuizzes()) {
            if (quiz.proctorPin() != null && quiz.proctorPin().equalsIgnoreCase(normalizedCode)) {
                if (quiz.status() == QuizStatus.DRAFT) {
                    logger.info("Access code {} rejected for quiz {}: draft quizzes cannot be proctored", normalizedCode, quiz.id());
                    return AccessResolutionResult.invalid("Proctoring is not allowed while quiz is in draft");
                }

                logger.info("Access code {} resolved to HOST for quiz {} (status={})", normalizedCode, quiz.id(), quiz.status());
                return AccessResolutionResult.host(quiz.id());
            }
        }

        // Third, check public quiz join code (6-character alphanumeric code).
        Optional<QuizInfoDto> publicQuiz = quizFacade.findQuizInfoByCode(normalizedCode);
        if (publicQuiz.isPresent()) {
            QuizInfoDto q = publicQuiz.get();
            if (q.accessMode() != QuizAccessMode.PUBLIC) {
                return AccessResolutionResult.invalid("This quiz is restricted and requires a team access code");
            }

            if (!(q.isLive() || q.status() == QuizStatus.READY)) {
                return AccessResolutionResult.invalid("Quiz session is not active");
            }

            // teamId intentionally null: frontend must collect participant/team name and call public join endpoint.
            logger.info("Access code {} resolved to PUBLIC PARTICIPANT pre-join for quiz {}", normalizedCode, q.id());
            return AccessResolutionResult.participant(null, q.id());
        }

        logger.info("Access code {} not found - returning INVALID", normalizedCode);
        return AccessResolutionResult.invalid("Invalid access code");
    }
}
