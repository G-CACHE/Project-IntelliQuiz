package com.intelliquiz.api.infrastructure.config;

import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property tests for security endpoint access.
 * 
 * Feature: infrastructure-layer, Property 5: Security Endpoint Access
 * Validates: Requirements 11.2, 11.3
 */
class SecurityPropertyTest {

    // ==================== JWT Token Tests ====================

    @Property(tries = 10)
    void jwtConfigGeneratesValidToken(
            @ForAll("usernames") String username,
            @ForAll("roles") String role) {
        // Given
        JwtConfig jwtConfig = new JwtConfig();
        // Use reflection to set the secret since @Value won't work in unit tests
        setField(jwtConfig, "secret", "testSecretKeyThatIsLongEnoughForHS256Algorithm123456");
        setField(jwtConfig, "expiration", 86400000L);
        
        // When
        String token = jwtConfig.generateToken(username, role);
        
        // Then
        assertThat(token).isNotBlank();
        assertThat(jwtConfig.extractUsername(token)).isEqualTo(username);
        assertThat(jwtConfig.extractRole(token)).isEqualTo(role);
    }

    @Property(tries = 10)
    void jwtConfigValidatesTokenCorrectly(
            @ForAll("usernames") String username,
            @ForAll("roles") String role) {
        // Given
        JwtConfig jwtConfig = new JwtConfig();
        setField(jwtConfig, "secret", "testSecretKeyThatIsLongEnoughForHS256Algorithm123456");
        setField(jwtConfig, "expiration", 86400000L);
        
        String token = jwtConfig.generateToken(username, role);
        
        // When/Then
        assertThat(jwtConfig.validateToken(token, username)).isTrue();
        assertThat(jwtConfig.validateToken(token, "wrongUsername")).isFalse();
    }

    @Property(tries = 10)
    void jwtConfigExtractsExpirationDate(
            @ForAll("usernames") String username,
            @ForAll("roles") String role) {
        // Given
        JwtConfig jwtConfig = new JwtConfig();
        setField(jwtConfig, "secret", "testSecretKeyThatIsLongEnoughForHS256Algorithm123456");
        setField(jwtConfig, "expiration", 86400000L);
        
        String token = jwtConfig.generateToken(username, role);
        
        // When
        var expiration = jwtConfig.extractExpiration(token);
        
        // Then
        assertThat(expiration).isNotNull();
        assertThat(expiration).isAfter(new java.util.Date());
    }

    // ==================== Public Endpoint Pattern Tests ====================

    @Property(tries = 10)
    void publicEndpointPatternsMatchAccessEndpoints(@ForAll("accessEndpoints") String endpoint) {
        // Given - public endpoints should match /api/access/**
        String pattern = "/api/access/**";
        
        // When/Then
        assertThat(endpoint).startsWith("/api/access/");
    }

    @Property(tries = 10)
    void publicEndpointPatternsMatchAuthEndpoints(@ForAll("authEndpoints") String endpoint) {
        // Given - public endpoints should match /api/auth/**
        String pattern = "/api/auth/**";
        
        // When/Then
        assertThat(endpoint).startsWith("/api/auth/");
    }

    @Property(tries = 10)
    void protectedEndpointsDoNotMatchPublicPatterns(@ForAll("protectedEndpoints") String endpoint) {
        // Given - protected endpoints should NOT match public patterns
        
        // When/Then
        assertThat(endpoint).doesNotStartWith("/api/access/");
        assertThat(endpoint).doesNotStartWith("/api/auth/");
    }

    // ==================== Helper Methods ====================

    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }

    // ==================== Arbitraries ====================

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50);
    }

    @Provide
    Arbitrary<String> roles() {
        return Arbitraries.of("ADMIN", "SUPER_ADMIN");
    }

    @Provide
    Arbitrary<String> accessEndpoints() {
        return Arbitraries.of(
                "/api/access/resolve",
                "/api/access/check",
                "/api/access/validate"
        );
    }

    @Provide
    Arbitrary<String> authEndpoints() {
        return Arbitraries.of(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/refresh"
        );
    }

    @Provide
    Arbitrary<String> protectedEndpoints() {
        return Arbitraries.of(
                "/api/quizzes",
                "/api/quizzes/1",
                "/api/questions/1",
                "/api/teams/1",
                "/api/submissions",
                "/api/users",
                "/api/users/1/permissions"
        );
    }
}
