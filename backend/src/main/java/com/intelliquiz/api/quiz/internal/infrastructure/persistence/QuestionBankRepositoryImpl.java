package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.quiz.internal.domain.ports.QuestionBankRepository;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of QuestionBankRepository port using Spring Data JPA.
 */
@Component
public class QuestionBankRepositoryImpl implements QuestionBankRepository {

    private final SpringQuestionBankRepository springQuestionBankRepository;

    public QuestionBankRepositoryImpl(SpringQuestionBankRepository springQuestionBankRepository) {
        this.springQuestionBankRepository = springQuestionBankRepository;
    }

    @Override
    public QuestionBankItem save(QuestionBankItem item) {
        return springQuestionBankRepository.save(item);
    }

    @Override
    public Optional<QuestionBankItem> findById(Long id) {
        return springQuestionBankRepository.findById(id);
    }

    @Override
    public List<QuestionBankItem> findByOwnerUserId(Long ownerUserId) {
        return springQuestionBankRepository.findByOwnerUserId(ownerUserId);
    }

    @Override
    public List<QuestionBankItem> findByOwnerUserIdAndType(Long ownerUserId, QuestionType type) {
        return springQuestionBankRepository.findByOwnerUserIdAndType(ownerUserId, type);
    }

    @Override
    public List<QuestionBankItem> findByOwnerUserIdAndDifficulty(Long ownerUserId, Difficulty difficulty) {
        return springQuestionBankRepository.findByOwnerUserIdAndDifficulty(ownerUserId, difficulty);
    }

    @Override
    public List<QuestionBankItem> findByOwnerUserIdAndTextContainingIgnoreCase(Long ownerUserId, String search) {
        return springQuestionBankRepository.findByOwnerUserIdAndTextContainingIgnoreCase(ownerUserId, search);
    }

    @Override
    public void delete(QuestionBankItem item) {
        springQuestionBankRepository.delete(item);
    }

    @Override
    public void deleteById(Long id) {
        springQuestionBankRepository.deleteById(id);
    }

    @Override
    public List<QuestionBankItem> findAllById(List<Long> ids) {
        return springQuestionBankRepository.findAllById(ids);
    }

    @Override
    public List<QuestionBankItem> findBySourceQuizId(Long sourceQuizId) {
        return springQuestionBankRepository.findBySourceQuizId(sourceQuizId);
    }
}
