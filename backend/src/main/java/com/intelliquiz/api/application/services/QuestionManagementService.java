package com.intelliquiz.api.application.services;

import com.intelliquiz.api.application.commands.CreateQuestionCommand;
import com.intelliquiz.api.application.commands.UpdateQuestionCommand;
import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for question management operations.
 * Handles CRUD operations and reordering of questions within a quiz.
 */
@Service
@Transactional
public class QuestionManagementService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuestionManagementService(QuestionRepository questionRepository, 
                                      QuizRepository quizRepository) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
    }

    /**
     * Adds a new question to a quiz.
     * The question is added at the end of the question list.
     */
    public Question addQuestion(Long quizId, CreateQuestionCommand command) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

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

        // Set order index to be at the end
        List<Question> existingQuestions = questionRepository.findByQuizOrderByOrderIndex(quiz);
        int nextIndex = existingQuestions.isEmpty() ? 0 : 
                existingQuestions.get(existingQuestions.size() - 1).getOrderIndex() + 1;
        question.setOrderIndex(nextIndex);

        question.validatePoints();
        question.validateOptions();

        quiz.addQuestion(question);
        return questionRepository.save(question);
    }

    /**
     * Updates an existing question.
     */
    public Question updateQuestion(Long questionId, UpdateQuestionCommand command) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));

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
        
        Quiz quiz = question.getQuiz();
        quiz.removeQuestion(question);
        questionRepository.delete(question);
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
}
