package com.intelliquiz.api.team.internal.domain.ports;

import com.intelliquiz.api.team.internal.domain.entities.Team;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Team persistence operations.
 */
public interface TeamRepository {

    Team save(Team team);

    Optional<Team> findById(Long id);

    Optional<Team> findByAccessCode(String accessCode);

    boolean existsByQuizIdAndNameIgnoreCase(Long quizId, String name);

    Optional<Team> findByQuizIdAndDeviceId(Long quizId, String deviceId);

    List<Team> findByQuizId(Long quizId);

    void delete(Team team);

    void deleteById(Long id);
}
