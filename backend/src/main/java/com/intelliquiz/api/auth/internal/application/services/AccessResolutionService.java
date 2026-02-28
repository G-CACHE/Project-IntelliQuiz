package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Application service for resolving access codes at the universal gate.
 * Uses TeamFacade and QuizFacade — no direct entity/repository access.
 */
@Service
public class AccessResolutionService {

    private final TeamFacade teamFacade;
    private final QuizFacade quizFacade;

    public AccessResolutionService(TeamFacade teamFacade, QuizFacade quizFacade) {
        this.teamFacade = teamFacade;
        this.quizFacade = quizFacade;
    }

    /**
     * Resolves an access code to determine the appropriate route.
     */
    public AccessResolutionResult resolve(String accessCode) {
        if (accessCode == null || accessCode.isBlank()) {
            return AccessResolutionResult.invalid("Access code is required");
        }

        String normalizedCode = accessCode.trim().toUpperCase();

        // First, check if it's a team access code
        Optional<TeamInfoDto> team = teamFacade.getTeamByAccessCode(normalizedCode);
        if (team.isPresent()) {
            Long quizId = team.get().quizId();
            Optional<QuizInfoDto> quiz = quizFacade.findQuizInfo(quizId);
            if (quiz.isPresent() && quiz.get().isLive()) {
                return AccessResolutionResult.participant(team.get().id(), quizId);
            }
            return AccessResolutionResult.invalid("Quiz session is not active");
        }

        // Second, check if it's a proctor PIN for an active quiz
        for (QuizInfoDto quiz : quizFacade.findActiveLiveQuizzes()) {
            if (quiz.proctorPin() != null && quiz.proctorPin().equalsIgnoreCase(normalizedCode)) {
                return AccessResolutionResult.host(quiz.id());
            }
        }

        return AccessResolutionResult.invalid("Invalid access code");
    }
}
