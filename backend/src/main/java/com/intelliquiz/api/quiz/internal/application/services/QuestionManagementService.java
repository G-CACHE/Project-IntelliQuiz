package com.intelliquiz.api.quiz.internal.application.services;

import com.intelliquiz.api.quiz.internal.application.commands.CreateQuestionCommand;
import com.intelliquiz.api.quiz.internal.application.commands.UpdateQuestionCommand;
import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.events.QuestionAddedEvent;
import com.intelliquiz.api.quiz.events.QuestionDeletedEvent;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.quiz.internal.domain.ports.QuestionRepository;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Application service for question management operations.
 * Handles CRUD operations and reordering of questions within a quiz.
 */
@Service
@Transactional
public class QuestionManagementService {

    private static final Logger log = LoggerFactory.getLogger(QuestionManagementService.class);

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final QuestionBankService questionBankService;

    public QuestionManagementService(QuestionRepository questionRepository, 
                                      QuizRepository quizRepository,
                                      ApplicationEventPublisher eventPublisher,
                                      QuestionBankService questionBankService) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.eventPublisher = eventPublisher;
        this.questionBankService = questionBankService;
    }

    /**
     * Adds a new question to a quiz.
     * The question is added at the end of the question list.
     * Auto-archives the question to the owner's Question Bank (fire-and-forget).
     *
     * @param quizId      the quiz to add the question to
     * @param command     the question creation command
     * @param ownerUserId the userId of the admin creating the question (for auto-archive)
     */
    public Question addQuestion(Long quizId, CreateQuestionCommand command, Long ownerUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        assertQuizEditable(quiz);

        Question question = new Question(
                quiz,
                command.text(),
                command.type(),
                command.difficulty(),
                command.correctKey()
        );
        question.setPoints(command.points());
        question.setTimeLimit(command.timeLimit());
        if (command.options() != null) {
            question.setOptions(command.options());
        }

        normalizeQuestionByType(question);

        // Set order index to be at the end
        List<Question> existingQuestions = questionRepository.findByQuizOrderByOrderIndex(quiz);
        int nextIndex = existingQuestions.isEmpty() ? 0 : 
                existingQuestions.get(existingQuestions.size() - 1).getOrderIndex() + 1;
        question.setOrderIndex(nextIndex);

        question.validatePoints();
        question.validateOptions();

        quiz.addQuestion(question);
        Question saved = questionRepository.save(question);
        eventPublisher.publishEvent(new QuestionAddedEvent(
                saved.getId(), quizId, Instant.now()));

        // Auto-archive to Question Bank (fire-and-forget)
        if (ownerUserId != null) {
            try {
                questionBankService.archiveFromQuiz(saved, ownerUserId, quiz.getTitle());
            } catch (Exception e) {
                log.warn("Failed to auto-archive question {} to bank for user {}: {}",
                        saved.getId(), ownerUserId, e.getMessage());
            }
        }

        return saved;
    }

    /**
     * Updates an existing question.
     */
    public Question updateQuestion(Long questionId, UpdateQuestionCommand command) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        assertQuizEditable(question.getQuiz());

        if (command.text() != null) {
            question.setText(command.text());
        }
        if (command.type() != null) {
            question.setType(command.type());
        }
        if (command.difficulty() != null) {
            question.setDifficulty(command.difficulty());
        }
        if (command.correctKey() != null) {
            question.setCorrectKey(command.correctKey());
        }
        question.setPoints(command.points());
        question.setTimeLimit(command.timeLimit());
        if (command.options() != null) {
            question.setOptions(command.options());
        }

        normalizeQuestionByType(question);

        question.validatePoints();
        question.validateOptions();

        return questionRepository.save(question);
    }

    /**
     * Deletes a question from a quiz.
     */
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        assertQuizEditable(question.getQuiz());
        
        Long quizId = question.getQuiz().getId();
        Quiz quiz = question.getQuiz();
        quiz.removeQuestion(question);
        questionRepository.delete(question);
        eventPublisher.publishEvent(new QuestionDeletedEvent(
                questionId, quizId, Instant.now()));
    }

    /**
     * Gets a question by ID.
     */
    public Question getQuestion(Long questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
    }

    /**
     * Gets all questions for a quiz, ordered by orderIndex.
     */
    public List<Question> getQuestionsByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        return questionRepository.findByQuizOrderByOrderIndex(quiz);
    }

    /**
     * Reorders questions within a quiz.
     * Updates the orderIndex of each question based on the provided order.
     */
    public void reorderQuestions(Long quizId, List<Long> questionIds) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        assertQuizEditable(quiz);

        List<Question> questions = questionRepository.findByQuiz(quiz);
        
        for (int i = 0; i < questionIds.size(); i++) {
            Long questionId = questionIds.get(i);
            questions.stream()
                    .filter(q -> q.getId().equals(questionId))
                    .findFirst()
                    .ifPresent(q -> {
                        q.setOrderIndex(questionIds.indexOf(q.getId()));
                        questionRepository.save(q);
                    });
        }
    }

    private void assertQuizEditable(Quiz quiz) {
        if (quiz.getStatus() == QuizStatus.ARCHIVED) {
            throw new IllegalArgumentException("Quiz is done and questions can no longer be edited");
        }
    }

    private void normalizeQuestionByType(Question question) {
        if (question.getType() == QuestionType.TRUE_FALSE) {
            // Keep a canonical option order so A=TRUE and B=FALSE is always deterministic.
            question.setOptions(new ArrayList<>(List.of("True", "False")));

            String normalizedKey = question.getCorrectKey() == null
                    ? ""
                    : question.getCorrectKey().trim().toUpperCase();
            if ("TRUE".equals(normalizedKey)) {
                question.setCorrectKey("A");
            } else if ("FALSE".equals(normalizedKey)) {
                question.setCorrectKey("B");
            }
        }

        if (question.getType() == QuestionType.IDENTIFICATION) {
            // Identification answers are encoded one per line in correctKey.
            question.setOptions(new ArrayList<>());
            if (question.getCorrectKey() != null) {
                String normalizedAnswers = question.getCorrectKey().lines()
                        .map(String::trim)
                        .filter(line -> !line.isBlank())
                        .distinct()
                        .reduce((a, b) -> a + "\n" + b)
                        .orElse("");
                question.setCorrectKey(normalizedAnswers);
            }
        }
    }
}
