package com.intelliquiz.api.auth.internal.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for JWT-based stateless authentication.
 * Configures public and protected endpoints.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfig corsConfig;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, CorsConfig corsConfig) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfig = corsConfig;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS with custom configuration
            .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
            
            // Disable CSRF for stateless API
            .csrf(csrf -> csrf.disable())
            
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight across API routes
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints - no authentication required
                .requestMatchers("/api/access/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // SSE + realtime quiz flow endpoints use access-code based session logic
                .requestMatchers(HttpMethod.GET, "/api/quiz/*/stream", "/api/quiz/*/status", "/api/quiz/*/state", "/api/quiz/*/participant-access", "/api/quiz/*/participant-results", "/api/quiz/*/violations", "/api/quiz/*/proctor-snapshot").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/quiz/*/answer", "/api/quiz/*/command", "/api/quiz/*/navigate", "/api/quiz/*/violation", "/api/quiz/*/kick", "/api/quiz/*/auto-kick-threshold", "/api/quiz/*/approve-reentry", "/api/quiz/*/lock", "/api/quiz/*/unlock").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/quiz/*/lock-status").permitAll()
                // WebSocket endpoints - authentication handled by WebSocket interceptor
                .requestMatchers("/ws/**").permitAll()
                // Swagger/OpenAPI endpoints
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                // Health check
                .requestMatchers("/actuator/health").permitAll()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            
            // Stateless session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
