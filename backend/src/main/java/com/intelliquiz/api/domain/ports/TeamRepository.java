package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Team persistence operations.
 */
public interface TeamRepository {

    Team save(Team team);

    Optional<Team> findById(Long id);

    Optional<Team> findByAccessCode(String accessCode);

    List<Team> findByQuiz(Quiz quiz);

    void delete(Team team);

    void deleteById(Long id);
}
