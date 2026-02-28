package com.intelliquiz.api.quiz.internal.application.services;

import com.intelliquiz.api.quiz.internal.application.commands.CreateQuizCommand;
import com.intelliquiz.api.quiz.internal.application.commands.UpdateQuizCommand;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.events.QuizCreatedEvent;
import com.intelliquiz.api.quiz.events.QuizStatusChangedEvent;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import com.intelliquiz.api.shared.services.CodeGenerationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Application service for quiz CRUD operations.
 * Handles creation, updates, deletion, and state transitions.
 */
@Service
@Transactional
public class QuizManagementService {

    private final QuizRepository quizRepository;
    private final CodeGenerationService codeGenerationService;
    private final ApplicationEventPublisher eventPublisher;

    public QuizManagementService(QuizRepository quizRepository, 
                                  CodeGenerationService codeGenerationService,
                                  ApplicationEventPublisher eventPublisher) {
        this.quizRepository = quizRepository;
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
        Quiz quiz = new Quiz(command.title(), command.description(), proctorPin, QuizStatus.DRAFT);
        quiz.validateTitle();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizCreatedEvent(
                saved.getId(), saved.getTitle(), Instant.now()));
        return saved;
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
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
    }

    /**
     * Gets all quizzes.
     * 
     * @return list of all quizzes
     */
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
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
}
