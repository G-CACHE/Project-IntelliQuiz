package com.intelliquiz.api.team;

import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.team.internal.application.services.TeamRegistrationService;
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
    private final TeamRegistrationService teamRegistrationService;

    public TeamFacade(TeamRepository teamRepository,
                      TeamRegistrationService teamRegistrationService) {
        this.teamRepository = teamRepository;
        this.teamRegistrationService = teamRegistrationService;
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
     * Gets a team by quiz and browser device ID.
     */
    public Optional<TeamInfoDto> getTeamByQuizAndDeviceId(Long quizId, String deviceId) {
        return teamRepository.findByQuizIdAndDeviceId(quizId, deviceId)
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

    /**
     * Registers a team and returns public team info.
     */
    public TeamInfoDto registerTeam(Long quizId, String teamName) {
        Team created = teamRegistrationService.registerTeam(quizId, teamName);
        return toDto(created);
    }

    /**
     * Binds/updates browser device ID to the given team for seamless rejoin.
     */
    public void bindDeviceId(Long teamId, String deviceId) {
        teamRepository.findById(teamId).ifPresent(team -> {
            team.setDeviceId(deviceId);
            teamRepository.save(team);
        });
    }

    /**
     * Updates a team's name if the provided access code matches.
     */
    public void updateTeamNameWithAccessCode(Long teamId, String newName, String accessCode) {
        teamRegistrationService.updateTeamNameWithAccessCode(teamId, newName, accessCode);
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
