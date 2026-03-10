package com.intelliquiz.api.realtime.internal.infrastructure.persistence;

import com.intelliquiz.api.realtime.internal.domain.entities.ViolationRecord;
import com.intelliquiz.api.realtime.internal.domain.ports.ViolationRecordRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Implementation of ViolationRecordRepository port using Spring Data JPA.
 */
@Component
public class ViolationRecordRepositoryImpl implements ViolationRecordRepository {

    private final SpringViolationRecordRepository springViolationRecordRepository;

    public ViolationRecordRepositoryImpl(SpringViolationRecordRepository springViolationRecordRepository) {
        this.springViolationRecordRepository = springViolationRecordRepository;
    }

    @Override
    public ViolationRecord save(ViolationRecord record) {
        return springViolationRecordRepository.save(record);
    }

    @Override
    public List<ViolationRecord> findByQuizId(Long quizId) {
        return springViolationRecordRepository.findByQuizId(quizId);
    }

    @Override
    public List<ViolationRecord> findByQuizIdAndTeamId(Long quizId, Long teamId) {
        return springViolationRecordRepository.findByQuizIdAndTeamId(quizId, teamId);
    }

    @Override
    public int countByQuizIdAndTeamId(Long quizId, Long teamId) {
        return springViolationRecordRepository.countByQuizIdAndTeamId(quizId, teamId);
    }

    @Override
    public void deleteByQuizId(Long quizId) {
        springViolationRecordRepository.deleteByQuizId(quizId);
    }
}
