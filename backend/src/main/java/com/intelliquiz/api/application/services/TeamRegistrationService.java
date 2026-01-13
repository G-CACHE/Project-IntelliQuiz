package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import com.intelliquiz.api.domain.services.CodeGenerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for team registration operations.
 * Handles team registration, removal, and score management.
 */
@Service
@Transactional
public class TeamRegistrationService {

    private final TeamRepository teamRepository;
    private final QuizRepository quizRepository;
    private final CodeGenerationService codeGenerationService;

    public TeamRegistrationService(TeamRepository teamRepository,
                                    QuizRepository quizRepository,
                                    CodeGenerationService codeGenerationService) {
        this.teamRepository = teamRepository;
        this.quizRepository = quizRepository;
        this.codeGenerationService = codeGenerationService;
    }

    /**
     * Registers a new team for a quiz with auto-generated access code.
     */
    public Team registerTeam(Long quizId, String teamName) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        String accessCode = generateUniqueAccessCode();
        Team team = new Team(quiz, teamName, accessCode);
        
        quiz.addTeam(team);
        return teamRepository.save(team);
    }

    /**
     * Removes a team from a quiz.
     */
    public void removeTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        Quiz quiz = team.getQuiz();
        quiz.removeTeam(team);
        teamRepository.delete(team);
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
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        return teamRepository.findByQuiz(quiz);
    }

    /**
     * Resets scores for all teams in a quiz.
     */
    public void resetTeamScores(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        
        List<Team> teams = teamRepository.findByQuiz(quiz);
        for (Team team : teams) {
            team.resetScore();
            teamRepository.save(team);
        }
    }

    /**
     * Updates a team's name.
     */
    public Team updateTeamName(Long teamId, String newName) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        team.setName(newName);
        return teamRepository.save(team);
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
