package com.intelliquiz.api.team.internal.application.services;

import com.intelliquiz.api.team.internal.domain.entities.Team;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.team.internal.domain.ports.TeamRepository;
import com.intelliquiz.api.shared.services.CodeGenerationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.intelliquiz.api.team.events.TeamRegisteredEvent;
import com.intelliquiz.api.team.events.TeamRemovedEvent;
import com.intelliquiz.api.team.events.TeamScoreResetEvent;
import com.intelliquiz.api.shared.enums.QuizStatus;

import java.util.List;

/**
 * Application service for team registration operations.
 * Handles team registration, removal, and score management.
 */
@Service
@Transactional
public class TeamRegistrationService {

    private final TeamRepository teamRepository;
    private final QuizFacade quizFacade;
    private final CodeGenerationService codeGenerationService;
    private final ApplicationEventPublisher eventPublisher;

    public TeamRegistrationService(TeamRepository teamRepository,
                                    QuizFacade quizFacade,
                                    CodeGenerationService codeGenerationService,
                                    ApplicationEventPublisher eventPublisher) {
        this.teamRepository = teamRepository;
        this.quizFacade = quizFacade;
        this.codeGenerationService = codeGenerationService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Registers a new team for a quiz with auto-generated access code.
     */
    public Team registerTeam(Long quizId, String teamName) {
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }
        assertQuizNotArchived(quizId);

        String accessCode = generateUniqueAccessCode();
        Team team = new Team(quizId, teamName, accessCode);
        
        Team saved = teamRepository.save(team);
        eventPublisher.publishEvent(new TeamRegisteredEvent(saved.getId(), saved.getName(), quizId));
        return saved;
    }

    /**
     * Removes a team from a quiz.
     */
    public void removeTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));

        assertQuizNotArchived(team.getQuizId());
        
        Long quizId = team.getQuizId();
        teamRepository.delete(team);
        eventPublisher.publishEvent(new TeamRemovedEvent(teamId, team.getName(), quizId));
    }

    /**
     * Gets a team by ID.
     */
    public Team getTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
    }

    /**
     * Gets a team by access code.
     */
    public Team getTeamByAccessCode(String accessCode) {
        return teamRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new EntityNotFoundException("Team with access code " + accessCode + " not found"));
    }

    /**
     * Gets all teams for a quiz.
     */
    public List<Team> getTeamsByQuiz(Long quizId) {
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }
        return teamRepository.findByQuizId(quizId);
    }

    /**
     * Resets scores for all teams in a quiz.
     */
    public void resetTeamScores(Long quizId) {
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }
        assertQuizNotArchived(quizId);
        
        List<Team> teams = teamRepository.findByQuizId(quizId);
        for (Team team : teams) {
            team.resetScore();
            teamRepository.save(team);
        }
        eventPublisher.publishEvent(new TeamScoreResetEvent(quizId));
    }

    /**
     * Updates a team's name.
     */
    public Team updateTeamName(Long teamId, String newName) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));

        assertQuizNotArchived(team.getQuizId());
        
        team.setName(newName);
        return teamRepository.save(team);
    }

    /**
     * Updates a team's name if the provided access code matches.
     * Used by participants to update their profile (e.g. adding an avatar).
     */
    public Team updateTeamNameWithAccessCode(Long teamId, String newName, String accessCode) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));

        if (!team.getAccessCode().equals(accessCode)) {
            throw new IllegalArgumentException("Invalid access code");
        }

        assertQuizNotArchived(team.getQuizId());
        
        team.setName(newName);
        return teamRepository.save(team);
    }

    private void assertQuizNotArchived(Long quizId) {
        var quiz = quizFacade.findQuizInfo(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        if (quiz.status() == QuizStatus.ARCHIVED) {
            throw new IllegalArgumentException("Quiz is done and no longer accepts registration or team modifications");
        }
    }

    /**
     * Generates a unique access code that doesn't already exist.
     */
    private String generateUniqueAccessCode() {
        String code;
        int attempts = 0;
        int maxAttempts = 100;
        
        do {
            code = codeGenerationService.generateTeamAccessCode();
            attempts++;
        } while (teamRepository.findByAccessCode(code).isPresent() && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            throw new IllegalStateException("Unable to generate unique access code after " + maxAttempts + " attempts");
        }
        
        return code;
    }
}
