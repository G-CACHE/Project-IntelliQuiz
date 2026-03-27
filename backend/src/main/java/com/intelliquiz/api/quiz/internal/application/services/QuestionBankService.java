package com.intelliquiz.api.quiz.internal.application.services;

import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.internal.domain.ports.QuestionBankRepository;
import com.intelliquiz.api.quiz.internal.domain.ports.QuestionRepository;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for Question Bank CRUD and ownership enforcement.
 */
@Service
@Transactional
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuestionBankService(QuestionBankRepository questionBankRepository,
                               QuestionRepository questionRepository,
                               QuizRepository quizRepository) {
        this.questionBankRepository = questionBankRepository;
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
    }

    /**
     * Auto-archives a question into the owner's bank after quiz question creation.
     * Fire-and-forget: failure here should not block quiz question creation.
     */
    public QuestionBankItem archiveFromQuiz(Question question, Long ownerUserId) {
        QuestionBankItem item = QuestionBankItem.fromQuestion(question, ownerUserId);
        return questionBankRepository.save(item);
    }

    /**
     * Auto-archives a question into the owner's bank with category (quiz title).
     * Fire-and-forget: failure here should not block quiz question creation.
     */
    public QuestionBankItem archiveFromQuiz(Question question, Long ownerUserId, String category) {
        QuestionBankItem item = QuestionBankItem.fromQuestion(question, ownerUserId);
        item.setCategory(category);
        return questionBankRepository.save(item);
    }

    /**
     * Lists bank items for a user, with optional filtering.
     */
    @Transactional(readOnly = true)
    public List<QuestionBankItem> getBankItems(Long userId, QuestionType type, Difficulty difficulty, String search) {
        if (search != null && !search.isBlank()) {
            return questionBankRepository.findByOwnerUserIdAndTextContainingIgnoreCase(userId, search.trim());
        }
        if (type != null) {
            return questionBankRepository.findByOwnerUserIdAndType(userId, type);
        }
        if (difficulty != null) {
            return questionBankRepository.findByOwnerUserIdAndDifficulty(userId, difficulty);
        }
        return questionBankRepository.findByOwnerUserId(userId);
    }

    /**
     * Gets a single bank item with ownership verification.
     */
    @Transactional(readOnly = true)
    public QuestionBankItem getBankItem(Long itemId, Long userId) {
        QuestionBankItem item = questionBankRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("QuestionBankItem", itemId));
        if (!item.getOwnerUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this question bank item");
        }
        return item;
    }

    /**
     * Deletes a bank item (owner only).
     */
    public void deleteBankItem(Long itemId, Long userId) {
        QuestionBankItem item = getBankItem(itemId, userId);
        questionBankRepository.delete(item);
    }

    /**
     * Copies a bank item into a quiz as a new question.
     * Verifies both bank item ownership and quiz ownership.
     */
    public Question attachToQuiz(Long bankItemId, Long quizId, Long userId, SystemRole role) {
        // Verify bank item ownership
        QuestionBankItem bankItem = getBankItem(bankItemId, userId);

        // Verify quiz ownership
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        if (quiz.getStatus() == com.intelliquiz.api.shared.enums.QuizStatus.ARCHIVED) {
            throw new IllegalArgumentException("Quiz is done and questions can no longer be edited");
        }
        if (role != SystemRole.SUPER_ADMIN && !quiz.getCreatedByUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this quiz");
        }

        // Determine next order index
        int nextIndex = quiz.getQuestions().size();

        // Create question from bank item
        Question question = bankItem.toQuizQuestion(quiz, nextIndex);
        return questionRepository.save(question);
    }

    // ==================== Harvest & Import (Game Workflow) ====================

    /**
     * Harvests all instant (ad-hoc) questions from a completed quiz into the examiner's bank.
     * Skips questions already present in the bank (by sourceQuestionId).
     */
    public List<QuestionBankItem> harvestInstantQuestions(Long quizId, Long examinerId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        // Get existing bank items sourced from this quiz to avoid duplicates
        List<QuestionBankItem> existing = questionBankRepository.findBySourceQuizId(quizId);
        java.util.Set<Long> existingSourceIds = existing.stream()
                .map(QuestionBankItem::getSourceQuestionId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        List<QuestionBankItem> harvested = new java.util.ArrayList<>();
        for (Question q : quiz.getQuestions()) {
            if (existingSourceIds.contains(q.getId())) continue;
            QuestionBankItem item = QuestionBankItem.fromQuestion(q, examinerId);
            item.setHarvested(true);
            item.setCategory(quiz.getTitle()); // default category = quiz title
            harvested.add(questionBankRepository.save(item));
        }
        return harvested;
    }

    /**
     * Imports multiple bank items into a quiz as new questions.
     * Returns the list of created questions.
     */
    public List<Question> importFromBank(List<Long> bankItemIds, Long quizId, Long userId, SystemRole role) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        if (quiz.getStatus() == com.intelliquiz.api.shared.enums.QuizStatus.ARCHIVED) {
            throw new IllegalArgumentException("Quiz is done and questions can no longer be edited");
        }
        if (role != SystemRole.SUPER_ADMIN && !quiz.getCreatedByUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this quiz");
        }

        List<QuestionBankItem> bankItems = questionBankRepository.findAllById(bankItemIds);
        int nextIndex = quiz.getQuestions().size();

        List<Question> created = new java.util.ArrayList<>();
        for (QuestionBankItem bankItem : bankItems) {
            if (!bankItem.getOwnerUserId().equals(userId)) {
                throw new AccessDeniedException("You do not own bank item " + bankItem.getId());
            }
            Question question = bankItem.toQuizQuestion(quiz, nextIndex++);
            created.add(questionRepository.save(question));
        }
        return created;
    }
}
