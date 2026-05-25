package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.QuestionType;

import java.util.List;

/**
 * Public DTO exposing question information to other modules (e.g., submission grading, realtime).
 */
public record QuestionInfoDto(Long id, String text, QuestionType type,
                               List<String> options, String correctKey,
                               int points, int timeLimit, int orderIndex,
                               String difficulty,
                               boolean caseSensitive) {

    /**
     * Resolves the letter-based correctKey (A/B/C/D) to the actual option text.
     * For MCQ: "B" with options ["Paris","London","Berlin","Rome"] → "London"
     * Falls back to the raw correctKey for identification-type questions or if resolution fails.
     */
    public String resolvedCorrectAnswer() {
        if (correctKey == null) {
            return null;
        }

        if (type == QuestionType.IDENTIFICATION) {
            return correctKey.lines()
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .findFirst()
                    .orElse(correctKey);
        }

        // TRUE_FALSE: correctKey is stored as the text value ("True" / "False") directly.
        if (type == QuestionType.TRUE_FALSE) {
            return correctKey;
        }

        // MULTIPLE_CHOICE: correctKey is a letter (A/B/C/D).
        // Resolve to option text for display purposes only — grading uses the letter directly.
        if (options == null || options.isEmpty()) {
            return correctKey;
        }
        String key = correctKey.toUpperCase().trim();
        if (key.length() == 1 && key.charAt(0) >= 'A' && key.charAt(0) <= 'Z') {
            int index = key.charAt(0) - 'A';
            if (index < options.size()) {
                return options.get(index);
            }
        }
        return correctKey;
    }
}
