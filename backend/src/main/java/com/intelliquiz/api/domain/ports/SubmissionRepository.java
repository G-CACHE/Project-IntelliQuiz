package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Submission persistence operations.
 */
public interface SubmissionRepository {

    Submission save(Submission submission);

    Optional<Submission> findById(Long id);

    List<Submission> findByTeam(Team team);

    List<Submission> findByQuestion(Question question);

    Optional<Submission> findByTeamAndQuestion(Team team, Question question);

    void delete(Submission submission);

    void deleteById(Long id);
}
