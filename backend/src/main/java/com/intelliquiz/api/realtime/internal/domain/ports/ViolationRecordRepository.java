package com.intelliquiz.api.realtime.internal.domain.ports;

import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;

import java.util.List;

/**
 * Outbound port for ViolationRecord persistence operations.
 */
public interface ViolationRecordRepository {

    ViolationRecord save(ViolationRecord record);

    List<ViolationRecord> findByQuizId(Long quizId);

    List<ViolationRecord> findByQuizIdAndTeamId(Long quizId, Long teamId);

    int countByQuizIdAndTeamId(Long quizId, Long teamId);

    void deleteByQuizId(Long quizId);
}
