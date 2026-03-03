package com.intelliquiz.api.submission.internal.domain.ports;

import com.intelliquiz.api.submission.internal.domain.entities.Submission;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Submission persistence operations.
 * Uses foreign-key IDs instead of entity references for module decoupling.
 */
public interface SubmissionRepository {

    Submission save(Submission submission);

    Optional<Submission> findById(Long id);

    List<Submission> findByTeamId(Long teamId);

    List<Submission> findByQuestionId(Long questionId);

    Optional<Submission> findByTeamIdAndQuestionId(Long teamId, Long questionId);

    void delete(Submission submission);

    void deleteById(Long id);

    void deleteByQuestionId(Long questionId);

    void deleteByTeamId(Long teamId);
}
