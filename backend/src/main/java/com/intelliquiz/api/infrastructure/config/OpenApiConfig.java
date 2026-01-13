package com.intelliquiz.api.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 configuration for IntelliQuiz API documentation.
 * Configures Swagger UI and API metadata including JWT security scheme.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("IntelliQuiz API")
                .version("1.0.0")
                .description("REST API for IntelliQuiz - an interactive quiz platform for creating, " +
                    "managing, and participating in quizzes. Supports quiz creation, team registration, " +
                    "answer submission, and real-time scoreboard tracking.")
                .contact(new Contact()
                    .name("IntelliQuiz Team")
                    .email("support@intelliquiz.com")))
            .servers(List.of(
                new Server()
                    .url("/")
                    .description("Default server")))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT token obtained from /api/auth/login")))
            .tags(List.of(
                new Tag().name("Authentication").description("User login and JWT token generation"),
                new Tag().name("Access").description("Access code resolution for quiz participants and hosts"),
                new Tag().name("Quizzes").description("Quiz CRUD operations and session management"),
                new Tag().name("Questions").description("Question management within quizzes"),
                new Tag().name("Teams").description("Team registration and management for quiz participation"),
                new Tag().name("Submissions").description("Answer submission and grading"),
                new Tag().name("Scoreboard").description("Quiz scoreboard and team rankings"),
                new Tag().name("Users").description("Admin user management (SUPER_ADMIN only)")
            ));
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
            .group("intelliquiz-api")
            .pathsToMatch("/api/**")
            .build();
    }
}
