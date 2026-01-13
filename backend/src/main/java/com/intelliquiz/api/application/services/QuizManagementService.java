package com.intelliquiz.api.application.services;

import com.intelliquiz.api.application.commands.CreateQuizCommand;
import com.intelliquiz.api.application.commands.UpdateQuizCommand;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.services.CodeGenerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public QuizManagementService(QuizRepository quizRepository, 
                                  CodeGenerationService codeGenerationService) {
        this.quizRepository = quizRepository;
        this.codeGenerationService = codeGenerationService;
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
        return quizRepository.save(quiz);
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
        quiz.transitionToReady();
        return quizRepository.save(quiz);
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
        quiz.archive();
        return quizRepository.save(quiz);
    }
}
