package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.shared.util.OptionOrderUtil;

import java.util.List;
import java.util.Locale;

/**
 * Public DTO exposing question information to other modules (e.g., submission grading, realtime).
 */
public record QuestionInfoDto(Long id, String text, QuestionType type,
                               List<String> options, String correctKey,
                               int points, int timeLimit, int orderIndex,
                               String difficulty,
                               boolean caseSensitive) {

    /**
     * Returns options in the shuffled order shown to a participant.
     * TRUE_FALSE and IDENTIFICATION keep canonical order.
     */
    public List<String> participantOptions(long teamId) {
        if (type != QuestionType.MULTIPLE_CHOICE || options == null || options.size() <= 1) {
            return options == null ? List.of() : options;
        }
        int[] permutation = OptionOrderUtil.createPermutation(
                options.size(), OptionOrderUtil.shuffleSeed(teamId, id));
        return OptionOrderUtil.applyPermutation(options, permutation);
    }

    /**
     * Converts a participant-facing display letter to the admin/canonical letter (A = first stored option).
     */
    public String displayLetterToAdminLetter(String displayLetter, long teamId) {
        if (displayLetter == null || displayLetter.isBlank()) {
            return "";
        }
        String upper = displayLetter.trim().toUpperCase(Locale.ROOT);
        if (type != QuestionType.MULTIPLE_CHOICE || options == null || options.isEmpty()) {
            return upper;
        }
        if (upper.length() != 1 || upper.charAt(0) < 'A') {
            return upper;
        }
        int displayIndex = upper.charAt(0) - 'A';
        if (displayIndex >= options.size()) {
            return upper;
        }
        int[] permutation = OptionOrderUtil.createPermutation(
                options.size(), OptionOrderUtil.shuffleSeed(teamId, id));
        int originalIndex = OptionOrderUtil.displayToOriginal(displayIndex, permutation);
        return String.valueOf((char) ('A' + originalIndex));
    }

    /**
     * Converts a participant-facing selection to the canonical admin answer key before persistence.
     */
    public String normalizeSubmissionOnSave(String submittedAnswer, long teamId) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return submittedAnswer;
        }

        if (type == QuestionType.TRUE_FALSE) {
            return normalizeTrueFalseKey(submittedAnswer);
        }

        if (type == QuestionType.MULTIPLE_CHOICE) {
            String trimmed = submittedAnswer.trim();
            String fromText = adminLetterForOptionText(trimmed);
            if (fromText != null) {
                return fromText;
            }
            String upper = trimmed.toUpperCase(Locale.ROOT);
            if (upper.length() == 1 && upper.charAt(0) >= 'A' && upper.charAt(0) < 'A' + safeOptionCount()) {
                return displayLetterToAdminLetter(upper, teamId);
            }
        }

        return submittedAnswer.trim();
    }

    /**
     * Normalizes a persisted or incoming answer to the admin letter/key used for grading.
     */
    public String toAdminAnswerKey(String submittedAnswer, long teamId) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return "";
        }

        if (type == QuestionType.IDENTIFICATION) {
            return submittedAnswer.trim();
        }

        if (type == QuestionType.TRUE_FALSE) {
            return normalizeTrueFalseKey(submittedAnswer);
        }

        String trimmed = submittedAnswer.trim();
        String upper = trimmed.toUpperCase(Locale.ROOT);

        // Preferred: option text (shuffle-independent)
        String fromText = adminLetterForOptionText(trimmed);
        if (fromText != null) {
            return fromText;
        }

        // Letter submission: stored admin key, or legacy participant display letter
        if (upper.length() == 1 && upper.charAt(0) >= 'A' && upper.charAt(0) < 'A' + safeOptionCount()) {
            return upper;
        }

        return upper;
    }

    /**
     * Evaluates whether a submission matches the admin-configured correct answer.
     */
    public boolean isCorrectSubmission(String submittedAnswer, long teamId) {
        if (type == QuestionType.IDENTIFICATION) {
            String submittedTrimmed = submittedAnswer == null ? "" : submittedAnswer.trim();
            if (correctKey == null || correctKey.isBlank()) {
                return false;
            }
            if (caseSensitive) {
                return parseAcceptedAnswers(correctKey).stream()
                        .anyMatch(accepted -> !accepted.isBlank() && accepted.equals(submittedTrimmed));
            }
            String submittedNormalized = normalizeIdentification(submittedTrimmed, false);
            return parseAcceptedAnswers(correctKey).stream()
                    .map(accepted -> normalizeIdentification(accepted, false))
                    .anyMatch(accepted -> !accepted.isBlank() && accepted.equals(submittedNormalized));
        }

        String adminCorrect = normalizeTrueFalseKey(correctKey == null ? "" : correctKey);
        if (adminCorrect.isBlank()) {
            return false;
        }

        if (type == QuestionType.MULTIPLE_CHOICE) {
            return matchesMcqAdminKey(submittedAnswer, adminCorrect, teamId);
        }

        String adminSubmitted = toAdminAnswerKey(submittedAnswer, teamId);
        return !adminSubmitted.isBlank() && adminSubmitted.equals(adminCorrect);
    }

    /**
     * Formats an answer for the post-quiz review modal: "b. Option text".
     */
    public String formatReviewAnswer(String submittedAnswer, long teamId) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return null;
        }
        if (type == QuestionType.IDENTIFICATION) {
            return submittedAnswer.trim();
        }
        String adminKey = resolveAdminKeyForReview(submittedAnswer, teamId);
        return formatAdminKeyForParticipant(adminKey, teamId);
    }

    /**
     * Formats the configured correct answer for review using the participant's option order.
     */
    public String formatCorrectReviewAnswer(long teamId) {
        if (correctKey == null || correctKey.isBlank()) {
            return null;
        }
        if (type == QuestionType.IDENTIFICATION) {
            return resolvedCorrectAnswer();
        }
        return formatAdminKeyForParticipant(normalizeTrueFalseKey(correctKey), teamId);
    }

    /**
     * Resolves the letter-based correctKey to option text (admin order).
     */
    public String resolvedCorrectAnswer() {
        if (correctKey == null) {
            return null;
        }

        if (type == QuestionType.IDENTIFICATION) {
            return parseAcceptedAnswers(correctKey).stream()
                    .reduce((a, b) -> a + ", " + b)
                    .orElse(correctKey);
        }

        if (type == QuestionType.TRUE_FALSE) {
            String key = normalizeTrueFalseKey(correctKey);
            return "A".equals(key) ? "True" : "False";
        }

        if (options == null || options.isEmpty()) {
            return correctKey;
        }
        String key = correctKey.toUpperCase(Locale.ROOT).trim();
        if (key.length() == 1 && key.charAt(0) >= 'A' && key.charAt(0) < 'A' + options.size()) {
            return options.get(key.charAt(0) - 'A');
        }
        return correctKey;
    }

    private String formatAdminKeyForParticipant(String adminKey, long teamId) {
        if (adminKey == null || adminKey.isBlank()) {
            return adminKey;
        }

        if (type == QuestionType.TRUE_FALSE) {
            String normalized = normalizeTrueFalseKey(adminKey);
            String text = "A".equals(normalized) ? "True" : "False";
            String letter = normalized.toLowerCase(Locale.ROOT);
            return letter + ". " + text;
        }

        if (options == null || options.isEmpty()) {
            return adminKey;
        }

        String normalized = adminKey.trim().toUpperCase(Locale.ROOT);
        if (normalized.length() != 1 || normalized.charAt(0) < 'A') {
            return adminKey;
        }
        int originalIndex = normalized.charAt(0) - 'A';
        if (originalIndex < 0 || originalIndex >= options.size()) {
            return adminKey;
        }

        int[] permutation = OptionOrderUtil.createPermutation(
                options.size(), OptionOrderUtil.shuffleSeed(teamId, id));
        int displayIndex = OptionOrderUtil.originalToDisplay(originalIndex, permutation);
        String displayLetter = String.valueOf((char) ('a' + displayIndex));
        String optionText = options.get(originalIndex);
        if (optionText == null || optionText.isBlank()) {
            optionText = "—";
        }
        return displayLetter + ". " + optionText;
    }

    private static String normalizeTrueFalseKey(String value) {
        if (value == null) {
            return "";
        }
        String upper = value.trim().toUpperCase(Locale.ROOT);
        if ("TRUE".equals(upper)) {
            return "A";
        }
        if ("FALSE".equals(upper)) {
            return "B";
        }
        return upper;
    }

    private static String normalizeIdentification(String value, boolean caseSensitive) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        return caseSensitive ? normalized : normalized.toUpperCase(Locale.ROOT);
    }

    private boolean matchesMcqAdminKey(String submittedAnswer, String adminCorrect, long teamId) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return false;
        }

        String trimmed = submittedAnswer.trim();
        String upper = trimmed.toUpperCase(Locale.ROOT);

        String fromText = adminLetterForOptionText(trimmed);
        if (fromText != null && fromText.equals(adminCorrect)) {
            return true;
        }

        if (upper.length() == 1 && upper.charAt(0) >= 'A' && upper.charAt(0) < 'A' + safeOptionCount()) {
            if (upper.equals(adminCorrect)) {
                return true;
            }
            return displayLetterToAdminLetter(upper, teamId).equals(adminCorrect);
        }

        return false;
    }

    /**
     * Resolves any stored MCQ/TF payload to the admin key for review formatting.
     */
    private String resolveAdminKeyForReview(String submittedAnswer, long teamId) {
        if (type == QuestionType.TRUE_FALSE) {
            return normalizeTrueFalseKey(submittedAnswer);
        }

        String trimmed = submittedAnswer.trim();
        String fromText = adminLetterForOptionText(trimmed);
        if (fromText != null) {
            return fromText;
        }

        String upper = trimmed.toUpperCase(Locale.ROOT);
        if (upper.length() != 1 || upper.charAt(0) < 'A' || upper.charAt(0) >= 'A' + safeOptionCount()) {
            return toAdminAnswerKey(submittedAnswer, teamId);
        }

        String adminCorrect = normalizeTrueFalseKey(correctKey == null ? "" : correctKey);
        String mappedFromDisplay = displayLetterToAdminLetter(upper, teamId);

        if (matchesMcqAdminKey(trimmed, adminCorrect, teamId)) {
            return upper.equals(adminCorrect) ? upper : mappedFromDisplay;
        }

        // Legacy participant display letter, or stored admin key for a wrong answer
        if (!mappedFromDisplay.equals(upper)) {
            return mappedFromDisplay;
        }
        return upper;
    }

    private String adminLetterForOptionText(String optionText) {
        if (options == null || optionText == null || optionText.isBlank()) {
            return null;
        }
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i).equalsIgnoreCase(optionText.trim())) {
                return String.valueOf((char) ('A' + i));
            }
        }
        return null;
    }

    private static List<String> parseAcceptedAnswers(String correctAnswer) {
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(correctAnswer.split("[\\r\\n,;]+"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .distinct()
                .toList();
    }

    private int safeOptionCount() {
        return options == null ? 0 : options.size();
    }
}
