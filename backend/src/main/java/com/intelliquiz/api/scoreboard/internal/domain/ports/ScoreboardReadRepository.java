package com.intelliquiz.api.scoreboard.internal.domain.ports;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;

import java.util.List;
import java.util.Optional;

/**
 * Port for the scoreboard read model repository.
 */
public interface ScoreboardReadRepository {

    List<ScoreboardEntry> findByQuizIdOrderByRankAsc(Long quizId);

    List<ScoreboardEntry> findByQuizId(Long quizId);

    Optional<ScoreboardEntry> findByTeamId(Long teamId);

    ScoreboardEntry save(ScoreboardEntry entry);

    void delete(ScoreboardEntry entry);

    void deleteByTeamId(Long teamId);

    void deleteByQuizId(Long quizId);

    void saveAll(List<ScoreboardEntry> entries);
}
