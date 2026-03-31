package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.submission.dto.SubmissionInfoDto;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.realtime.internal.presentation.dto.AnswerDistribution;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for calculating answer distribution for MCQ questions.
 * Used to generate bar graph data for answer reveal.
 * Uses module facades instead of direct repository access.
 */
@Service
public class AnswerDistributionService {

    private final QuizFacade quizFacade;
    private final SubmissionFacade submissionFacade;

    public AnswerDistributionService(
            QuizFacade quizFacade,
            SubmissionFacade submissionFacade
    ) {
        this.quizFacade = quizFacade;
        this.submissionFacade = submissionFacade;
    }

    /**
     * Calculates the answer distribution for a question.
     * For MCQ: counts how many teams chose each option (A, B, C, D).
     * For Identification: counts correct vs incorrect.
     */
    public AnswerDistribution calculateDistribution(Long questionId) {
        QuestionInfoDto question = quizFacade.getQuestionForGrading(questionId);
        if (question == null) {
            return AnswerDistribution.empty();
        }

        List<SubmissionInfoDto> submissions = submissionFacade.getSubmissionsByQuestion(questionId);
        
        if (question.type() == QuestionType.MULTIPLE_CHOICE) {
            return calculateMcqDistribution(question, submissions);
        } else {
            return calculateIdentificationDistribution(question, submissions);
        }
    }

    /**
     * Calculates distribution for MCQ questions.
     * Counts submissions per option (by option text).
     */
    private AnswerDistribution calculateMcqDistribution(QuestionInfoDto question, List<SubmissionInfoDto> submissions) {
        Map<String, Integer> optionCounts = new HashMap<>();
        
        // Initialize all options with 0 — use option TEXT as keys
        List<String> options = question.options();
        for (int i = 0; i < options.size() && i < 4; i++) {
            optionCounts.put(options.get(i), 0);
        }
        
        // Resolve letter-based correctKey to option text
        String resolvedCorrectAnswer = question.resolvedCorrectAnswer();
        
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (SubmissionInfoDto submission : submissions) {
            String answer = submission.submittedAnswer();
            if (answer != null && !answer.isBlank()) {
                String trimmedAnswer = answer.trim();
                
                // Count the option — submitted answers are option text
                if (optionCounts.containsKey(trimmedAnswer)) {
                    optionCounts.merge(trimmedAnswer, 1, (left, right) -> left + right);
                }
                
                // Count correct/incorrect using resolved answer
                if (isCorrectAnswer(trimmedAnswer, resolvedCorrectAnswer)) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            } else {
                incorrectCount++; // No answer counts as incorrect
            }
        }
        
        return new AnswerDistribution(optionCounts, correctCount, incorrectCount);
    }

    /**
     * Calculates distribution for identification questions.
     * Simply counts correct vs incorrect.
     */
    private AnswerDistribution calculateIdentificationDistribution(QuestionInfoDto question, List<SubmissionInfoDto> submissions) {
        String resolvedCorrectAnswer = question.resolvedCorrectAnswer();
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (SubmissionInfoDto submission : submissions) {
            if (isCorrectAnswer(submission.submittedAnswer(), resolvedCorrectAnswer)) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
        
        // For identification, we don't have option counts
        return new AnswerDistribution(Map.of(), correctCount, incorrectCount);
    }

    /**
     * Checks if an answer matches the correct key (case-insensitive, trimmed).
     */
    private static boolean isCorrectAnswer(String answer, String correctKey) {
        if (answer == null || correctKey == null) {
            return false;
        }
        String normalizedAnswer = normalize(answer);
        return correctKey.lines()
                .map(AnswerDistributionService::normalize)
                .anyMatch(accepted -> !accepted.isBlank() && accepted.equals(normalizedAnswer));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
