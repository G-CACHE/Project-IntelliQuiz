package com.intelliquiz.api.team.dto;

/**
 * Public DTO for cross-module team information.
 */
public record TeamInfoDto(Long id, String name, String accessCode, int totalScore, Long quizId) {
}
