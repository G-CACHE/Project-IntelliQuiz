package com.intelliquiz.api.submission.internal.infrastructure.persistence;

import com.intelliquiz.api.submission.internal.domain.entities.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Submission entity.
 */
@Repository
public interface SpringSubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByTeamId(Long teamId);

    List<Submission> findByQuestionId(Long questionId);

    Optional<Submission> findByTeamIdAndQuestionId(Long teamId, Long questionId);

    @Modifying
    @Query("UPDATE Submission s SET s.deleted = true WHERE s.questionId = :questionId")
    void deleteByQuestionId(@Param("questionId") Long questionId);

    @Modifying
    @Query("UPDATE Submission s SET s.deleted = true WHERE s.teamId = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);
}
