package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.ports.QuizAssignmentRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringQuizAssignmentRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of QuizAssignmentRepository port using Spring Data JPA.
 */
@Component
public class QuizAssignmentRepositoryImpl implements QuizAssignmentRepository {

    private final SpringQuizAssignmentRepository springQuizAssignmentRepository;

    public QuizAssignmentRepositoryImpl(SpringQuizAssignmentRepository springQuizAssignmentRepository) {
        this.springQuizAssignmentRepository = springQuizAssignmentRepository;
    }

    @Override
    public QuizAssignment save(QuizAssignment assignment) {
        return springQuizAssignmentRepository.save(assignment);
    }

    @Override
    public Optional<QuizAssignment> findById(Long id) {
        return springQuizAssignmentRepository.findById(id);
    }

    @Override
    public Optional<QuizAssignment> findByUserAndQuiz(User user, Quiz quiz) {
        return springQuizAssignmentRepository.findByUserAndQuiz(user, quiz);
    }

    @Override
    public List<QuizAssignment> findByUser(User user) {
        return springQuizAssignmentRepository.findByUser(user);
    }

    @Override
    public List<QuizAssignment> findByQuiz(Quiz quiz) {
        return springQuizAssignmentRepository.findByQuiz(quiz);
    }

    @Override
    public void delete(QuizAssignment assignment) {
        springQuizAssignmentRepository.delete(assignment);
    }

    @Override
    public void deleteById(Long id) {
        springQuizAssignmentRepository.deleteById(id);
    }
}
