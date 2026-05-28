package com.intelliquiz.api.team.internal.infrastructure.persistence;

import com.intelliquiz.api.team.internal.domain.entities.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Team entity.
 */
@Repository
public interface SpringTeamRepository extends JpaRepository<Team, Long> {

    /**
     * Find team by access code.
     * Uses case-insensitive comparison for access codes.
     */
    @Query("SELECT t FROM Team t WHERE UPPER(t.accessCode) = UPPER(:accessCode)")
    Optional<Team> findByAccessCode(@Param("accessCode") String accessCode);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Team t WHERE t.quizId = :quizId AND UPPER(t.name) = UPPER(:name)")
    boolean existsByQuizIdAndNameIgnoreCase(@Param("quizId") Long quizId, @Param("name") String name);

    Optional<Team> findByQuizIdAndDeviceId(Long quizId, String deviceId);

    List<Team> findByQuizId(Long quizId);
}
