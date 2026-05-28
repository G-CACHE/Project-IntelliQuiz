package com.intelliquiz.api.auth.internal.application.services;

import com.intelliquiz.api.auth.internal.domain.entities.RefreshToken;
import com.intelliquiz.api.auth.internal.infrastructure.persistence.SpringRefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Manages refresh token lifecycle: creation, validation, rotation, and revocation.
 * Raw token values are never persisted — only their SHA-256 hash.
 */
@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration:604800000}") // 7 days default
    private long refreshExpirationMs;

    private final SpringRefreshTokenRepository repository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(SpringRefreshTokenRepository repository) {
        this.repository = repository;
    }

    /**
     * Generates a cryptographically random refresh token, persists its hash, and returns the raw value.
     * The raw value is placed in the cookie; the hash is stored in the DB.
     */
    @Transactional
    public String createRefreshToken(Long userId, String username, String role) {
        String rawToken = generateRawToken();
        String hash = sha256(rawToken);
        Instant expiresAt = Instant.now().plusMillis(refreshExpirationMs);

        repository.save(new RefreshToken(hash, userId, username, role, expiresAt));
        return rawToken;
    }

    /**
     * Validates the raw token from the cookie.
     * Returns the stored record if valid, empty otherwise.
     */
    @Transactional(readOnly = true)
    public Optional<RefreshToken> validate(String rawToken) {
        String hash = sha256(rawToken);
        return repository.findByTokenHash(hash)
                .filter(RefreshToken::isValid);
    }

    /**
     * Rotates a refresh token: revokes the old one and issues a new raw token.
     * Returns the new raw token value to be set in the cookie.
     */
    @Transactional
    public String rotate(String oldRawToken, Long userId, String username, String role) {
        String oldHash = sha256(oldRawToken);
        repository.findByTokenHash(oldHash).ifPresent(RefreshToken::revoke);

        return createRefreshToken(userId, username, role);
    }

    /**
     * Revokes all refresh tokens for a user (called on logout).
     */
    @Transactional
    public void revokeAll(Long userId) {
        repository.revokeAllByUserId(userId);
    }

    /** Scheduled cleanup of expired tokens — runs daily at 03:00. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        repository.deleteExpiredTokens(Instant.now());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String generateRawToken() {
        byte[] bytes = new byte[48]; // 384 bits → 64-char base64url
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
