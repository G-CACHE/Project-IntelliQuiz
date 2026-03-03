package com.intelliquiz.api.user.internal.infrastructure.persistence;

import com.intelliquiz.api.user.internal.domain.entities.QuizAssignment;
import com.intelliquiz.api.user.internal.domain.entities.User;
import com.intelliquiz.api.user.internal.domain.ports.QuizAssignmentRepository;
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
    public Optional<QuizAssignment> findByUserAndQuizId(User user, Long quizId) {
        return springQuizAssignmentRepository.findByUserAndQuizId(user, quizId);
    }

    @Override
    public List<QuizAssignment> findByUser(User user) {
        return springQuizAssignmentRepository.findByUser(user);
    }

    @Override
    public List<QuizAssignment> findByQuizId(Long quizId) {
        return springQuizAssignmentRepository.findByQuizId(quizId);
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
