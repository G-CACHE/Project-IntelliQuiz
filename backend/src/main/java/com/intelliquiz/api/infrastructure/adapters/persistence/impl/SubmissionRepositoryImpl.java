package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringSubmissionRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of SubmissionRepository port using Spring Data JPA.
 */
@Component
public class SubmissionRepositoryImpl implements SubmissionRepository {

    private final SpringSubmissionRepository springSubmissionRepository;

    public SubmissionRepositoryImpl(SpringSubmissionRepository springSubmissionRepository) {
        this.springSubmissionRepository = springSubmissionRepository;
    }

    @Override
    public Submission save(Submission submission) {
        return springSubmissionRepository.save(submission);
    }

    @Override
    public Optional<Submission> findById(Long id) {
        return springSubmissionRepository.findById(id);
    }

    @Override
    public List<Submission> findByTeam(Team team) {
        return springSubmissionRepository.findByTeam(team);
    }

    @Override
    public List<Submission> findByQuestion(Question question) {
        return springSubmissionRepository.findByQuestion(question);
    }

    @Override
    public Optional<Submission> findByTeamAndQuestion(Team team, Question question) {
        return springSubmissionRepository.findByTeamAndQuestion(team, question);
    }

    @Override
    public void delete(Submission submission) {
        springSubmissionRepository.delete(submission);
    }

    @Override
    public void deleteById(Long id) {
        springSubmissionRepository.deleteById(id);
    }
}
