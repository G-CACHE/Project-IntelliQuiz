package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for QuestionBankItem.
 */
public interface SpringQuestionBankRepository extends JpaRepository<QuestionBankItem, Long> {

    @EntityGraph(attributePaths = "options")
    List<QuestionBankItem> findByOwnerUserId(Long ownerUserId);

    @EntityGraph(attributePaths = "options")
    List<QuestionBankItem> findByOwnerUserIdAndType(Long ownerUserId, QuestionType type);

    @EntityGraph(attributePaths = "options")
    List<QuestionBankItem> findByOwnerUserIdAndDifficulty(Long ownerUserId, Difficulty difficulty);

    @EntityGraph(attributePaths = "options")
    List<QuestionBankItem> findByOwnerUserIdAndTextContainingIgnoreCase(Long ownerUserId, String search);

    @EntityGraph(attributePaths = "options")
    List<QuestionBankItem> findBySourceQuizId(Long sourceQuizId);
}
