package com.intelliquiz.api.submission.internal.infrastructure.persistence;

import com.intelliquiz.api.submission.internal.domain.entities.Submission;
import com.intelliquiz.api.submission.internal.domain.ports.SubmissionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
    public List<Submission> findByTeamId(Long teamId) {
        return springSubmissionRepository.findByTeamId(teamId);
    }

    @Override
    public List<Submission> findByQuestionId(Long questionId) {
        return springSubmissionRepository.findByQuestionId(questionId);
    }

    @Override
    public Optional<Submission> findByTeamIdAndQuestionId(Long teamId, Long questionId) {
        return springSubmissionRepository.findByTeamIdAndQuestionId(teamId, questionId);
    }

    @Override
    public void delete(Submission submission) {
        springSubmissionRepository.delete(submission);
    }

    @Override
    public void deleteById(Long id) {
        springSubmissionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByQuestionId(Long questionId) {
        springSubmissionRepository.deleteByQuestionId(questionId);
    }

    @Override
    @Transactional
    public void deleteByTeamId(Long teamId) {
        springSubmissionRepository.deleteByTeamId(teamId);
    }
}
