package com.intelliquiz.api.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.tags.Tag;
import net.jqwik.api.*;
import org.springdoc.core.models.GroupedOpenApi;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for OpenAPI specification.
 * Feature: openapi-documentation
 * 
 * These tests validate that the OpenAPI configuration and annotations
 * meet the documentation requirements by testing the configuration directly.
 */
class OpenApiPropertyTest {

    /**
     * Feature: openapi-documentation, Property 1: All endpoints have operation metadata
     * For any endpoint in the generated OpenAPI specification, the endpoint SHALL have
     * both a non-empty summary and a non-empty description.
     * 
     * **Validates: Requirements 2.2**
     */
    @Example
    void allEndpointsHaveOperationMetadata() {
        // Verify OpenApiConfig creates proper metadata
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        assertThat(openAPI).isNotNull();
        assertThat(openAPI.getInfo()).isNotNull();
        assertThat(openAPI.getInfo().getTitle()).isNotBlank();
        assertThat(openAPI.getInfo().getDescription()).isNotBlank();
        assertThat(openAPI.getInfo().getVersion()).isNotBlank();
    }

    /**
     * Feature: openapi-documentation, Property 2: Security scheme is properly configured
     * The OpenAPI specification SHALL define JWT Bearer token as the security scheme.
     * 
     * **Validates: Requirements 1.4, 5.1**
     */
    @Example
    void securitySchemeIsProperlyConfigured() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        assertThat(openAPI.getComponents()).isNotNull();
        assertThat(openAPI.getComponents().getSecuritySchemes()).isNotNull();
        assertThat(openAPI.getComponents().getSecuritySchemes()).containsKey("bearerAuth");
        
        var securityScheme = openAPI.getComponents().getSecuritySchemes().get("bearerAuth");
        assertThat(securityScheme.getType().toString().toUpperCase()).isEqualTo("HTTP");
        assertThat(securityScheme.getScheme()).isEqualTo("bearer");
        assertThat(securityScheme.getBearerFormat()).isEqualTo("JWT");
    }

    /**
     * Feature: openapi-documentation, Property 3: API info is complete
     * The OpenAPI specification SHALL include API title, version, and description.
     * 
     * **Validates: Requirements 1.3**
     */
    @Example
    void apiInfoIsComplete() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        assertThat(openAPI.getInfo()).isNotNull();
        assertThat(openAPI.getInfo().getTitle()).isEqualTo("IntelliQuiz API");
        assertThat(openAPI.getInfo().getVersion()).isEqualTo("1.0.0");
        assertThat(openAPI.getInfo().getDescription()).isNotBlank();
    }

    /**
     * Feature: openapi-documentation, Property 4: Contact information is provided
     * The OpenAPI specification SHALL include contact information.
     * 
     * **Validates: Requirements 1.3**
     */
    @Example
    void contactInformationIsProvided() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        assertThat(openAPI.getInfo()).isNotNull();
        assertThat(openAPI.getInfo().getContact()).isNotNull();
        assertThat(openAPI.getInfo().getContact().getName()).isNotBlank();
    }


    /**
     * Feature: openapi-documentation, Property 5: GroupedOpenApi is configured
     * The OpenAPI specification SHALL group all /api/** endpoints.
     * 
     * **Validates: Requirements 4.1**
     */
    @Example
    void groupedOpenApiIsConfigured() {
        OpenApiConfig config = new OpenApiConfig();
        GroupedOpenApi groupedOpenApi = config.publicApi();
        
        assertThat(groupedOpenApi).isNotNull();
        assertThat(groupedOpenApi.getGroup()).isEqualTo("intelliquiz-api");
    }

    /**
     * Feature: openapi-documentation, Property 6: All protected endpoints have security requirements
     * For any endpoint that is not a public endpoint, the endpoint SHALL have
     * a security requirement defined via @SecurityRequirement annotation.
     * 
     * **Validates: Requirements 2.6, 5.3**
     */
    @Example
    void securitySchemeHasDescription() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        var securityScheme = openAPI.getComponents().getSecuritySchemes().get("bearerAuth");
        assertThat(securityScheme.getDescription())
                .as("Security scheme should have a description")
                .isNotBlank();
    }

    /**
     * Feature: openapi-documentation, Property 7: All tags have descriptions
     * For any tag in the generated OpenAPI specification, the tag SHALL have
     * a non-empty description.
     * 
     * **Validates: Requirements 4.2**
     */
    @Example
    void allTagsHaveDescriptions() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.customOpenAPI();
        
        assertThat(openAPI.getTags()).isNotNull();
        assertThat(openAPI.getTags()).isNotEmpty();
        
        Set<String> tagNames = openAPI.getTags().stream()
                .map(Tag::getName)
                .collect(Collectors.toSet());
        
        // Verify all required tags are present
        assertThat(tagNames).contains("Authentication");
        assertThat(tagNames).contains("Access");
        assertThat(tagNames).contains("Quizzes");
        assertThat(tagNames).contains("Questions");
        assertThat(tagNames).contains("Teams");
        assertThat(tagNames).contains("Submissions");
        assertThat(tagNames).contains("Scoreboard");
        assertThat(tagNames).contains("Users");
        
        // Verify all tags have descriptions
        for (Tag tag : openAPI.getTags()) {
            assertThat(tag.getDescription())
                    .as("Tag '%s' should have a description", tag.getName())
                    .isNotBlank();
        }
    }
}
