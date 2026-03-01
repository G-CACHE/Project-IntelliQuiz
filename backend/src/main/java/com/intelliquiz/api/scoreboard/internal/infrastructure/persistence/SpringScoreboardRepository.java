package com.intelliquiz.api.scoreboard.internal.infrastructure.persistence;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for ScoreboardEntry.
 */
public interface SpringScoreboardRepository extends JpaRepository<ScoreboardEntry, Long> {

    List<ScoreboardEntry> findByQuizIdOrderByRankAsc(Long quizId);

    List<ScoreboardEntry> findByQuizId(Long quizId);

    Optional<ScoreboardEntry> findByTeamId(Long teamId);

    @Modifying
    @Query("UPDATE ScoreboardEntry s SET s.deleted = true WHERE s.teamId = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);

    @Modifying
    @Query("UPDATE ScoreboardEntry s SET s.deleted = true WHERE s.quizId = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}
