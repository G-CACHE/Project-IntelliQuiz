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

        if (options == null || options.isEmpty()) {
            if (type == QuestionType.TRUE_FALSE) {
                String key = correctKey.toUpperCase().trim();
                if ("A".equals(key)) return "True";
                if ("B".equals(key)) return "False";
            }
            return correctKey;
        }
        String key = correctKey.toUpperCase().trim();
        if (key.length() == 1 && key.charAt(0) >= 'A' && key.charAt(0) <= 'D') {
            int index = key.charAt(0) - 'A';
            if (index < options.size()) {
                return options.get(index);
            }
        }
        // Fallback: correctKey may already be the answer text (identification type)
        return correctKey;
    }
}
