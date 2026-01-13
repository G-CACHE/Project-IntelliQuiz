package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.User;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for User persistence operations.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    List<User> findAll();

    void delete(User user);

    void deleteById(Long id);

    boolean existsByUsername(String username);
}
