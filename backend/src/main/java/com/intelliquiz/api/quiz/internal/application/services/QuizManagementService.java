package com.intelliquiz.api.quiz.internal.application.services;

import com.intelliquiz.api.quiz.internal.application.commands.CreateQuizCommand;
import com.intelliquiz.api.quiz.internal.application.commands.UpdateQuizCommand;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.internal.domain.entities.QuestionBankItem;
import com.intelliquiz.api.quiz.events.QuizCreatedEvent;
import com.intelliquiz.api.quiz.events.QuizStatusChangedEvent;
import com.intelliquiz.api.quiz.internal.domain.ports.QuestionBankRepository;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import com.intelliquiz.api.shared.services.CodeGenerationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Application service for quiz CRUD operations.
 * Handles creation, updates, deletion, and state transitions.
 */
@Service
@Transactional
public class QuizManagementService {

    private static final int QUIZ_CODE_MAX_ATTEMPTS = 20;

    private final QuizRepository quizRepository;
    private final QuestionBankRepository questionBankRepository;
    private final CodeGenerationService codeGenerationService;
    private final ApplicationEventPublisher eventPublisher;

    public QuizManagementService(QuizRepository quizRepository, 
                                  QuestionBankRepository questionBankRepository,
                                  CodeGenerationService codeGenerationService,
                                  ApplicationEventPublisher eventPublisher) {
        this.quizRepository = quizRepository;
        this.questionBankRepository = questionBankRepository;
        this.codeGenerationService = codeGenerationService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates a new quiz with generated proctor PIN.
     * New quizzes start in DRAFT status.
     * 
     * @param command the create quiz command
     * @return the created quiz
     */
    public Quiz createQuiz(CreateQuizCommand command) {
        String proctorPin = codeGenerationService.generateProctorPin();
        String quizCode = generateUniqueQuizCode();
        Quiz quiz = new Quiz(command.title(), command.description(), proctorPin, QuizStatus.DRAFT);
        quiz.setQuizCode(quizCode);
        quiz.setCreatedByUserId(command.createdByUserId());
        quiz.setAccessMode(command.accessMode() != null ? command.accessMode() : QuizAccessMode.RESTRICTED);
        
        // Set navigation mode and global time limit if provided
        if (command.navigationMode() != null) {
            quiz.setNavigationMode(command.navigationMode());
        }
        if (command.globalTimeLimitSeconds() != null) {
            quiz.setGlobalTimeLimitSeconds(command.globalTimeLimitSeconds());
        }
        if (command.randomizeQuestions() != null) {
            quiz.setRandomizeQuestions(command.randomizeQuestions());
        }
        
        quiz.validateTitle();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizCreatedEvent(
                saved.getId(), saved.getTitle(), Instant.now()));
        return saved;
    }

    private String generateUniqueQuizCode() {
        for (int i = 0; i < QUIZ_CODE_MAX_ATTEMPTS; i++) {
            String candidate = codeGenerationService.generateQuizCode();
            if (!quizRepository.existsByQuizCodeIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique quiz code");
    }

    /**
     * Gets quizzes filtered by ownership.
     * SUPER_ADMIN sees all quizzes; ADMIN sees only their own.
     *
     * @param userId the current user's ID
     * @param role   the current user's role
     * @return list of accessible quizzes
     */
    public List<Quiz> getQuizzesForUser(Long userId, SystemRole role) {
        if (role == SystemRole.SUPER_ADMIN) {
            List<Quiz> quizzes = quizRepository.findAll();
            quizzes.forEach(this::ensureQuizCode);
            return quizzes;
        }
        List<Quiz> quizzes = quizRepository.findByCreatedByUserId(userId);
        quizzes.forEach(this::ensureQuizCode);
        return quizzes;
    }

    /**
     * Gets a single quiz with ownership verification.
     * SUPER_ADMIN can access any quiz; ADMIN can access only their own.
     *
     * @param quizId the quiz ID
     * @param userId the current user's ID
     * @param role   the current user's role
     * @return the quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     * @throws AccessDeniedException   if the user doesn't own the quiz
     */
    public Quiz getQuizForUser(Long quizId, Long userId, SystemRole role) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        ensureQuizCode(quiz);
        if (role != SystemRole.SUPER_ADMIN && !quiz.getCreatedByUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this quiz");
        }
        return quiz;
    }

    /**
     * Verifies the current user has access to the given quiz.
     * Intended for sub-resource controllers (questions, teams) that need quiz ownership checks.
     *
     * @param quizId the quiz ID
     * @param userId the current user's ID
     * @param role   the current user's role
     * @throws EntityNotFoundException if the quiz doesn't exist
     * @throws AccessDeniedException   if the user doesn't own the quiz
     */
    public void verifyQuizAccess(Long quizId, Long userId, SystemRole role) {
        getQuizForUser(quizId, userId, role);
    }

    /**
     * Updates an existing quiz's details.
     * 
     * @param quizId the ID of the quiz to update
     * @param command the update quiz command
     * @return the updated quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz updateQuiz(Long quizId, UpdateQuizCommand command) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        if (command.title() != null) {
            quiz.setTitle(command.title());
        }
        if (command.description() != null) {
            quiz.setDescription(command.description());
        }
        if (command.accessMode() != null) {
            quiz.setAccessMode(command.accessMode());
        }
        if (command.navigationMode() != null) {
            quiz.setNavigationMode(command.navigationMode());
        }
        if (command.globalTimeLimitSeconds() != null) {
            quiz.setGlobalTimeLimitSeconds(command.globalTimeLimitSeconds());
        }
        if (command.randomizeQuestions() != null) {
            quiz.setRandomizeQuestions(command.randomizeQuestions());
        }
        
        quiz.validateTitle();
        
        return quizRepository.save(quiz);
    }

    /**
     * Deletes a quiz and all related entities (cascade).
     * 
     * @param quizId the ID of the quiz to delete
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        // Keep bank entries intact even after quiz deletion by detaching source linkage.
        List<QuestionBankItem> bankItems = questionBankRepository.findBySourceQuizId(quizId);
        for (QuestionBankItem item : bankItems) {
            item.setSourceQuizId(null);
            questionBankRepository.save(item);
        }

        quizRepository.delete(quiz);
    }

    /**
     * Gets a quiz by ID.
     * 
     * @param quizId the ID of the quiz
     * @return the quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz getQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        ensureQuizCode(quiz);
        return quiz;
    }

    /**
     * Gets all quizzes.
     * 
     * @return list of all quizzes
     */
    public List<Quiz> getAllQuizzes() {
        List<Quiz> quizzes = quizRepository.findAll();
        quizzes.forEach(this::ensureQuizCode);
        return quizzes;
    }

    /**
     * Gets a quiz by participant-facing quiz code.
     */
    public Optional<Quiz> getQuizByCode(String quizCode) {
        if (quizCode == null || quizCode.isBlank()) {
            return Optional.empty();
        }
        return quizRepository.findByQuizCodeIgnoreCase(quizCode.trim());
    }

    /**
     * Transitions a quiz from DRAFT to READY status.
     * Validates that the quiz has required content.
     * 
     * @param quizId the ID of the quiz
     * @return the updated quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz transitionToReady(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        QuizStatus oldStatus = quiz.getStatus();
        quiz.transitionToReady();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizStatusChangedEvent(
                saved.getId(), oldStatus, saved.getStatus(), Instant.now()));
        return saved;
    }

    /**
     * Returns a READY quiz back to DRAFT (unready).
     */
    public Quiz transitionToDraft(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        QuizStatus oldStatus = quiz.getStatus();
        quiz.transitionToDraft();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizStatusChangedEvent(
                saved.getId(), oldStatus, saved.getStatus(), Instant.now()));
        return saved;
    }

    /**
     * Archives a quiz.
     * 
     * @param quizId the ID of the quiz
     * @return the archived quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz archiveQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        QuizStatus oldStatus = quiz.getStatus();
        quiz.archive();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizStatusChangedEvent(
                saved.getId(), oldStatus, saved.getStatus(), Instant.now()));
        return saved;
    }

    private void ensureQuizCode(Quiz quiz) {
        if (quiz.getQuizCode() != null && !quiz.getQuizCode().isBlank()) {
            return;
        }
        quiz.setQuizCode(generateUniqueQuizCode());
        quizRepository.save(quiz);
    }
}
