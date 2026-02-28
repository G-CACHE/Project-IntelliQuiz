package com.intelliquiz.api.scoreboard.internal.infrastructure.persistence;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for ScoreboardEntry.
 */
public interface SpringScoreboardRepository extends JpaRepository<ScoreboardEntry, Long> {

    List<ScoreboardEntry> findByQuizIdOrderByRankAsc(Long quizId);

    List<ScoreboardEntry> findByQuizId(Long quizId);

    Optional<ScoreboardEntry> findByTeamId(Long teamId);

    void deleteByTeamId(Long teamId);

    void deleteByQuizId(Long quizId);
}
