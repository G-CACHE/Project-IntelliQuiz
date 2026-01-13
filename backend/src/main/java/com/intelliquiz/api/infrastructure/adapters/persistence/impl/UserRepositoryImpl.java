package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.ports.UserRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringUserRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of UserRepository port using Spring Data JPA.
 */
@Component
public class UserRepositoryImpl implements UserRepository {

    private final SpringUserRepository springUserRepository;

    public UserRepositoryImpl(SpringUserRepository springUserRepository) {
        this.springUserRepository = springUserRepository;
    }

    @Override
    public User save(User user) {
        return springUserRepository.save(user);
    }

    @Override
    public Optional<User> findById(Long id) {
        return springUserRepository.findById(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return springUserRepository.findByUsername(username);
    }

    @Override
    public List<User> findAll() {
        return springUserRepository.findAll();
    }

    @Override
    public void delete(User user) {
        springUserRepository.delete(user);
    }

    @Override
    public void deleteById(Long id) {
        springUserRepository.deleteById(id);
    }

    @Override
    public boolean existsByUsername(String username) {
        return springUserRepository.existsByUsername(username);
    }
}
