package com.intelliquiz.api.quiz.internal.domain.ports;

import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for QuestionBankItem persistence operations.
 */
public interface QuestionBankRepository {

    QuestionBankItem save(QuestionBankItem item);

    Optional<QuestionBankItem> findById(Long id);

    List<QuestionBankItem> findByOwnerUserId(Long ownerUserId);

    List<QuestionBankItem> findByOwnerUserIdAndType(Long ownerUserId, QuestionType type);

    List<QuestionBankItem> findByOwnerUserIdAndDifficulty(Long ownerUserId, Difficulty difficulty);

    List<QuestionBankItem> findByOwnerUserIdAndTextContainingIgnoreCase(Long ownerUserId, String search);

    void delete(QuestionBankItem item);

    void deleteById(Long id);
}
