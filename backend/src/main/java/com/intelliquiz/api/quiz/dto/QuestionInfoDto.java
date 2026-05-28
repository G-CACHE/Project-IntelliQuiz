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
            // Return all accepted answers joined by newline for display.
            // The frontend splits on newlines to render each answer separately.
            return correctKey.lines()
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .reduce((a, b) -> a + "\n" + b)
                    .orElse(correctKey);
        }

        // TRUE_FALSE: correctKey is stored as "A" (True) or "B" (False).
        // Resolve to the text value for display purposes.
        if (type == QuestionType.TRUE_FALSE) {
            if (correctKey == null) return null;
            String key = correctKey.trim().toUpperCase();
            if ("A".equals(key)) return "True";
            if ("B".equals(key)) return "False";
            return correctKey; // fallback for legacy data stored as text
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
