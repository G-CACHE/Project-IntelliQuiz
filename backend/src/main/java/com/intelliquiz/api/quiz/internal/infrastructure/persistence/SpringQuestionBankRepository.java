package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for QuestionBankItem.
 */
public interface SpringQuestionBankRepository extends JpaRepository<QuestionBankItem, Long> {

    List<QuestionBankItem> findByOwnerUserId(Long ownerUserId);

    List<QuestionBankItem> findByOwnerUserIdAndType(Long ownerUserId, QuestionType type);

    List<QuestionBankItem> findByOwnerUserIdAndDifficulty(Long ownerUserId, Difficulty difficulty);

    List<QuestionBankItem> findByOwnerUserIdAndTextContainingIgnoreCase(Long ownerUserId, String search);

    List<QuestionBankItem> findBySourceQuizId(Long sourceQuizId);
}
