package com.intelliquiz.api.realtime.internal.infrastructure.persistence;

import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for ViolationRecord.
 */
public interface SpringViolationRecordRepository extends JpaRepository<ViolationRecord, Long> {

    List<ViolationRecord> findByQuizId(Long quizId);

    List<ViolationRecord> findByQuizIdAndTeamId(Long quizId, Long teamId);

    int countByQuizIdAndTeamId(Long quizId, Long teamId);

    void deleteByQuizId(Long quizId);
}
