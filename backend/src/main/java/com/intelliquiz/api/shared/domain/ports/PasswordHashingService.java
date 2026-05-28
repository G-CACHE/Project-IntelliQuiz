package com.intelliquiz.api.shared.domain.ports;

/**
 * Port interface for password hashing operations.
 * Lives in the shared module so both auth and user modules can use it
 * without cross-module coupling.
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
