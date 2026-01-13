package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Quiz entity.
 */
@Repository
public interface SpringQuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByIsLiveSessionTrue();
}
