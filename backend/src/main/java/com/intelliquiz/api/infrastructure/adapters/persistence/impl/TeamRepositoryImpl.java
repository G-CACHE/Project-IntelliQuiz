package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.ports.TeamRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringTeamRepository;
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
    public List<Team> findByQuiz(Quiz quiz) {
        return springTeamRepository.findByQuiz(quiz);
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
