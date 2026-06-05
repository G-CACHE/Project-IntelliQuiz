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
        
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (SubmissionInfoDto submission : submissions) {
            String answer = submission.submittedAnswer();
            if (answer != null && !answer.isBlank()) {
                String trimmedAnswer = answer.trim();
                long teamId = submission.teamId();

                String optionText = resolveMcqOptionText(question, trimmedAnswer, teamId);
                if (optionText != null && optionCounts.containsKey(optionText)) {
                    optionCounts.merge(optionText, 1, Integer::sum);
                }

                if (question.isCorrectSubmission(trimmedAnswer, teamId)) {
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
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (SubmissionInfoDto submission : submissions) {
            if (question.isCorrectSubmission(submission.submittedAnswer(), submission.teamId())) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
        
        // For identification, we don't have option counts
        return new AnswerDistribution(Map.of(), correctCount, incorrectCount);
    }

    /**
     * Maps a stored MCQ submission (letter or option text) to canonical option text for bar charts.
     */
    private static String resolveMcqOptionText(QuestionInfoDto question, String submittedAnswer, long teamId) {
        String reviewLabel = question.formatReviewAnswer(submittedAnswer, teamId);
        if (reviewLabel == null || reviewLabel.isBlank()) {
            return null;
        }
        int separator = reviewLabel.indexOf(". ");
        if (separator >= 0 && separator + 2 < reviewLabel.length()) {
            return reviewLabel.substring(separator + 2);
        }
        return reviewLabel;
    }
}
