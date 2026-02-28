package com.intelliquiz.api.team;

import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.team.internal.domain.entities.Team;
import com.intelliquiz.api.team.internal.domain.ports.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Public facade for the team module.
 * Provides cross-module access to team information.
 */
@Service
public class TeamFacade {

    private final TeamRepository teamRepository;

    public TeamFacade(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    /**
     * Gets team info by ID.
     */
    public Optional<TeamInfoDto> getTeamInfo(Long teamId) {
        return teamRepository.findById(teamId)
                .map(this::toDto);
    }

    /**
     * Gets a team by access code.
     */
    public Optional<TeamInfoDto> getTeamByAccessCode(String accessCode) {
        return teamRepository.findByAccessCode(accessCode)
                .map(this::toDto);
    }

    /**
     * Gets all teams for a quiz.
     */
    public List<TeamInfoDto> getTeamsByQuiz(Long quizId) {
        return teamRepository.findByQuizId(quizId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Gets the count of teams for a quiz.
     */
    public long getTeamCount(Long quizId) {
        return teamRepository.findByQuizId(quizId).size();
    }

    /**
     * Checks if a team exists.
     */
    public boolean teamExists(Long teamId) {
        return teamRepository.findById(teamId).isPresent();
    }

    /**
     * Adds points to a team's score.
     */
    public void addPoints(Long teamId, int points) {
        teamRepository.findById(teamId).ifPresent(team -> {
            team.addPoints(points);
            teamRepository.save(team);
        });
    }

    private TeamInfoDto toDto(Team team) {
        return new TeamInfoDto(
            team.getId(),
            team.getName(),
            team.getAccessCode(),
            team.getTotalScore(),
            team.getQuizId()
        );
    }
}
