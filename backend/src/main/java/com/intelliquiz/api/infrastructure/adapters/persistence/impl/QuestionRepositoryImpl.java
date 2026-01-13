package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringQuestionRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of QuestionRepository port using Spring Data JPA.
 */
@Component
public class QuestionRepositoryImpl implements QuestionRepository {

    private final SpringQuestionRepository springQuestionRepository;

    public QuestionRepositoryImpl(SpringQuestionRepository springQuestionRepository) {
        this.springQuestionRepository = springQuestionRepository;
    }

    @Override
    public Question save(Question question) {
        return springQuestionRepository.save(question);
    }

    @Override
    public Optional<Question> findById(Long id) {
        return springQuestionRepository.findById(id);
    }

    @Override
    public List<Question> findByQuiz(Quiz quiz) {
        return springQuestionRepository.findByQuiz(quiz);
    }

    @Override
    public List<Question> findByQuizOrderByOrderIndex(Quiz quiz) {
        return springQuestionRepository.findByQuizOrderByOrderIndex(quiz);
    }

    @Override
    public void delete(Question question) {
        springQuestionRepository.delete(question);
    }

    @Override
    public void deleteById(Long id) {
        springQuestionRepository.deleteById(id);
    }
}
