package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Application service for resolving access codes at the universal gate.
 * Determines if an access code is a team code, proctor PIN, or invalid.
 */
@Service
public class AccessResolutionService {

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
     * 2. Check if code matches a proctor PIN for an active quiz -> HOST route
     * 3. Otherwise -> INVALID route
     * 
     * @param accessCode the access code to resolve
     * @return AccessResolutionResult with route type and entity
     */
    public AccessResolutionResult resolve(String accessCode) {
        if (accessCode == null || accessCode.isBlank()) {
            return AccessResolutionResult.invalid("Access code is required");
        }

        String normalizedCode = accessCode.trim().toUpperCase();

        // First, check if it's a team access code
        Optional<Team> team = teamRepository.findByAccessCode(normalizedCode);
        if (team.isPresent()) {
            // Verify the team's quiz is active
            Quiz quiz = team.get().getQuiz();
            if (quiz != null && quiz.isLiveSession()) {
                return AccessResolutionResult.participant(team.get());
            }
            return AccessResolutionResult.invalid("Quiz session is not active");
        }

        // Second, check if it's a proctor PIN for an active quiz
        List<Quiz> activeQuizzes = quizRepository.findByIsLiveSessionTrue();
        for (Quiz quiz : activeQuizzes) {
            if (quiz.getProctorPin() != null && quiz.getProctorPin().equalsIgnoreCase(normalizedCode)) {
                return AccessResolutionResult.host(quiz);
            }
        }

        // No match found
        return AccessResolutionResult.invalid("Invalid access code");
    }
}
