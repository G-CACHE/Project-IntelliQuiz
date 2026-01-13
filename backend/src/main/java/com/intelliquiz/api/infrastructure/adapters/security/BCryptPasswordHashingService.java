package com.intelliquiz.api.infrastructure.adapters.security;

import com.intelliquiz.api.domain.ports.PasswordHashingService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * BCrypt implementation of PasswordHashingService.
 * Uses Spring Security's BCryptPasswordEncoder for secure password hashing.
 */
@Component
public class BCryptPasswordHashingService implements PasswordHashingService {

    private final BCryptPasswordEncoder encoder;

    public BCryptPasswordHashingService() {
        this.encoder = new BCryptPasswordEncoder();
    }

    @Override
    public String hash(String plainPassword) {
        if (plainPassword == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        return encoder.encode(plainPassword);
    }

    @Override
    public boolean matches(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) {
            return false;
        }
        return encoder.matches(plainPassword, hashedPassword);
    }
}
