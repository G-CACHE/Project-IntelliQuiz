package com.intelliquiz.api.team.internal.infrastructure.persistence;

import com.intelliquiz.api.team.internal.domain.entities.Team;
import com.intelliquiz.api.team.internal.domain.ports.TeamRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of TeamRepository port using Spring Data JPA.
 */
@Component
public class TeamRepositoryImpl implements TeamRepository {

    private final SpringTeamRepository springTeamRepository;

    public TeamRepositoryImpl(SpringTeamRepository springTeamRepository) {
        this.springTeamRepository = springTeamRepository;
    }

    @Override
    public Team save(Team team) {
        return springTeamRepository.save(team);
    }

    @Override
    public Optional<Team> findById(Long id) {
        return springTeamRepository.findById(id);
    }

    @Override
    public Optional<Team> findByAccessCode(String accessCode) {
        return springTeamRepository.findByAccessCode(accessCode);
    }

    @Override
    public Optional<Team> findByQuizIdAndDeviceId(Long quizId, String deviceId) {
        return springTeamRepository.findByQuizIdAndDeviceId(quizId, deviceId);
    }

    @Override
    public List<Team> findByQuizId(Long quizId) {
        return springTeamRepository.findByQuizId(quizId);
    }

    @Override
    public void delete(Team team) {
        springTeamRepository.delete(team);
    }

    @Override
    public void deleteById(Long id) {
        springTeamRepository.deleteById(id);
    }
}
