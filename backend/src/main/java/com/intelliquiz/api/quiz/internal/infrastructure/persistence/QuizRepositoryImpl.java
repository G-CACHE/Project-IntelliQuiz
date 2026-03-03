package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import com.intelliquiz.api.quiz.internal.infrastructure.persistence.SpringQuizRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of QuizRepository port using Spring Data JPA.
 */
@Component
public class QuizRepositoryImpl implements QuizRepository {

    private final SpringQuizRepository springQuizRepository;

    public QuizRepositoryImpl(SpringQuizRepository springQuizRepository) {
        this.springQuizRepository = springQuizRepository;
    }

    @Override
    public Quiz save(Quiz quiz) {
        return springQuizRepository.save(quiz);
    }

    @Override
    public Optional<Quiz> findById(Long id) {
        return springQuizRepository.findById(id);
    }

    @Override
    public List<Quiz> findAll() {
        return springQuizRepository.findAll();
    }

    @Override
    public List<Quiz> findByCreatedByUserId(Long userId) {
        return springQuizRepository.findByCreatedByUserId(userId);
    }

    @Override
    public List<Quiz> findByIsLiveSessionTrue() {
        return springQuizRepository.findByIsLiveSessionTrue();
    }

    @Override
    public void delete(Quiz quiz) {
        springQuizRepository.delete(quiz);
    }

    @Override
    public void deleteById(Long id) {
        springQuizRepository.deleteById(id);
    }
}
