package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Application service for resolving access codes at the universal gate.
 * Determines if an access code is a team code, proctor PIN, or invalid.
 */
@Service
public class AccessResolutionService {

    private static final Logger logger = LoggerFactory.getLogger(AccessResolutionService.class);

    private final TeamRepository teamRepository;
    private final QuizRepository quizRepository;

    public AccessResolutionService(TeamRepository teamRepository, QuizRepository quizRepository) {
        this.teamRepository = teamRepository;
        this.quizRepository = quizRepository;
    }

    /**
     * Resolves an access code to determine the appropriate route.
     * 
     * Resolution order:
     * 1. Check if code matches a team access code -> PARTICIPANT route
     * 2. Check if code matches a proctor PIN for an active or ready quiz -> HOST route
     * 3. Otherwise -> INVALID route
     * 
     * @param accessCode the access code to resolve
     * @return AccessResolutionResult with route type and entity
     */
    @Transactional(readOnly = true)
    public AccessResolutionResult resolve(String accessCode) {
        if (accessCode == null || accessCode.isBlank()) {
            return AccessResolutionResult.invalid("Access code is required");
        }

        String normalizedCode = accessCode.trim().toUpperCase();
        logger.debug("Resolving access code: {}", normalizedCode);

        // First, check if it's a team access code
        Optional<Team> team = teamRepository.findByAccessCode(normalizedCode);
        if (team.isPresent()) {
            logger.debug("Found team with access code: {}", normalizedCode);
            // Verify the team's quiz is active or ready (participants can join lobby before quiz starts)
            Quiz quiz = team.get().getQuiz();
            if (quiz != null) {
                logger.debug("Team's quiz: id={}, status={}, isLiveSession={}", 
                        quiz.getId(), quiz.getStatus(), quiz.isLiveSession());
                if (quiz.isLiveSession() || quiz.getStatus() == com.intelliquiz.api.domain.enums.QuizStatus.READY) {
                    logger.info("Access code {} resolved to PARTICIPANT for team {} in quiz {}", 
                            normalizedCode, team.get().getId(), quiz.getId());
                    return AccessResolutionResult.participant(team.get());
                }
            } else {
                logger.warn("Team {} has no associated quiz", team.get().getId());
            }
            logger.info("Access code {} rejected: Quiz session is not active", normalizedCode);
            return AccessResolutionResult.invalid("Quiz session is not active");
        }

        // Second, check if it's a proctor PIN for any quiz (active or ready)
        // Proctors should be able to access the lobby to start the quiz
        List<Quiz> allQuizzes = quizRepository.findAll();
        logger.debug("Checking {} quizzes for proctor PIN match", allQuizzes.size());
        for (Quiz quiz : allQuizzes) {
            if (quiz.getProctorPin() != null && quiz.getProctorPin().equalsIgnoreCase(normalizedCode)) {
                logger.info("Access code {} resolved to HOST for quiz {}", normalizedCode, quiz.getId());
                return AccessResolutionResult.host(quiz);
            }
        }

        // No match found
        logger.info("Access code {} not found - returning INVALID", normalizedCode);
        return AccessResolutionResult.invalid("Invalid access code");
    }
}
