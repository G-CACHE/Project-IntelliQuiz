package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public AccessResolutionService(TeamFacade teamFacade, QuizFacade quizFacade) {
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
    }

    /**
     * Resolves an access code to determine the appropriate route.
     *
     * Resolution order:
     * 1. Check if code matches a team access code -> PARTICIPANT route (if quiz is active or READY)
     * 2. Check if code matches a proctor PIN for any quiz -> HOST route
     * 3. Otherwise -> INVALID route
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

        // Second, check if it's a proctor PIN for any quiz
        // Proctors should be able to access the lobby to start the quiz
        for (QuizInfoDto quiz : quizFacade.findAllQuizzes()) {
            if (quiz.proctorPin() != null && quiz.proctorPin().equalsIgnoreCase(normalizedCode)) {
                logger.info("Access code {} resolved to HOST for quiz {}", normalizedCode, quiz.id());
                return AccessResolutionResult.host(quiz.id());
            }
        }

        logger.info("Access code {} not found - returning INVALID", normalizedCode);
        return AccessResolutionResult.invalid("Invalid access code");
    }
}
