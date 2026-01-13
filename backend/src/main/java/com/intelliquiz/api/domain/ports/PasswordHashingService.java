package com.intelliquiz.api.domain.ports;

/**
 * Port interface for password hashing operations.
 * This is an outbound port that will be implemented by infrastructure adapters.
 */
public interface PasswordHashingService {

    /**
     * Hashes a plain text password.
     * 
     * @param plainPassword the plain text password to hash
     * @return the hashed password
     */
    String hash(String plainPassword);

    /**
     * Verifies if a plain text password matches a hashed password.
     * 
     * @param plainPassword the plain text password to verify
     * @param hashedPassword the hashed password to compare against
     * @return true if the passwords match
     */
    boolean matches(String plainPassword, String hashedPassword);
}
