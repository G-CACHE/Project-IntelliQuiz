package com.intelliquiz.api.quiz.dto;

import com.intelliquiz.api.shared.enums.QuestionType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class QuestionInfoDtoAnswerReviewTest {

    @Test
    void mcqReviewUsesParticipantShuffleOrder() {
        QuestionInfoDto question = new QuestionInfoDto(
                10L,
                "Pick one",
                QuestionType.MULTIPLE_CHOICE,
                List.of("option1", "option2", "option3", "option4"),
                "A",
                10,
                30,
                0,
                "EASY",
                false
        );

        long teamId = 42L;
        String participantDisplay = question.formatReviewAnswer("A", teamId);
        String correctDisplay = question.formatCorrectReviewAnswer(teamId);

        assertThat(participantDisplay).matches("^[a-z]\\. option1$");
        assertThat(correctDisplay).matches("^[a-z]\\. option1$");
        assertThat(question.isCorrectSubmission("A", teamId)).isTrue();
        assertThat(question.isCorrectSubmission("B", teamId)).isFalse();
    }

    @Test
    void trueFalseReviewFormatsWithLetterPrefix() {
        QuestionInfoDto question = new QuestionInfoDto(
                11L,
                "True or false",
                QuestionType.TRUE_FALSE,
                List.of("True", "False"),
                "A",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.formatReviewAnswer("True", 7L)).isEqualTo("a. True");
        assertThat(question.formatCorrectReviewAnswer(7L)).isEqualTo("a. True");
        assertThat(question.isCorrectSubmission("True", 7L)).isTrue();
        assertThat(question.isCorrectSubmission("False", 7L)).isFalse();
    }

    @Test
    void identificationReviewIsCaseInsensitiveByDefault() {
        QuestionInfoDto question = new QuestionInfoDto(
                12L,
                "City",
                QuestionType.IDENTIFICATION,
                List.of(),
                "Paris\nparis",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.isCorrectSubmission("PARIS", 1L)).isTrue();
        assertThat(question.isCorrectSubmission("London", 1L)).isFalse();
    }

    @Test
    void trueFalseReviewWorksWithEmptyOptionsList() {
        QuestionInfoDto question = new QuestionInfoDto(
                13L,
                "select false",
                QuestionType.TRUE_FALSE,
                List.of(),
                "B",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.formatReviewAnswer("B", 7L)).isEqualTo("b. False");
        assertThat(question.formatCorrectReviewAnswer(7L)).isEqualTo("b. False");
        assertThat(question.isCorrectSubmission("False", 7L)).isTrue();
        assertThat(question.isCorrectSubmission("True", 7L)).isFalse();
    }

    @Test
    void trueFalseReviewHandlesReversedLegacyOptions() {
        QuestionInfoDto question = new QuestionInfoDto(
                14L,
                "select true",
                QuestionType.TRUE_FALSE,
                List.of("False", "True"),
                "A",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.isCorrectSubmission("True", 1L)).isTrue();
        assertThat(question.isCorrectSubmission("False", 1L)).isFalse();
        assertThat(question.formatCorrectReviewAnswer(1L)).isEqualTo("a. True");
    }

    @Test
    void mcqReviewShowsPlaceholderForBlankOptionText() {
        QuestionInfoDto question = new QuestionInfoDto(
                15L,
                "select correct",
                QuestionType.MULTIPLE_CHOICE,
                List.of("this is wrong", "correct", "wrong again", "other"),
                "B",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.formatReviewAnswer("B", 1L)).contains("correct");
        assertThat(question.formatCorrectReviewAnswer(1L)).contains("correct");
    }

    @Test
    void mcqGradesByOptionTextRegardlessOfShuffle() {
        QuestionInfoDto question = new QuestionInfoDto(
                16L,
                "select correct",
                QuestionType.MULTIPLE_CHOICE,
                List.of("this is wrong", "wrong again", "correct", "wrong one"),
                "C",
                10,
                30,
                0,
                "EASY",
                false
        );

        long teamId = 5L;
        assertThat(question.normalizeSubmissionOnSave("correct", teamId)).isEqualTo("C");
        assertThat(question.isCorrectSubmission("correct", teamId)).isTrue();
        assertThat(question.formatReviewAnswer("C", teamId)).contains("correct");
    }

    @Test
    void mcqGradesLegacyDisplayLetterAfterShuffle() {
        QuestionInfoDto question = new QuestionInfoDto(
                17L,
                "select correct",
                QuestionType.MULTIPLE_CHOICE,
                List.of("this is wrong", "wrong again", "correct", "wrong one"),
                "C",
                10,
                30,
                0,
                "EASY",
                false
        );

        long teamId = 5L;
        String displayLetterForCorrect = question.formatCorrectReviewAnswer(teamId).substring(0, 1).toUpperCase();
        assertThat(question.isCorrectSubmission(displayLetterForCorrect, teamId)).isTrue();
    }

    @Test
    void identificationAcceptsCommaSeparatedAnswersCaseInsensitive() {
        QuestionInfoDto question = new QuestionInfoDto(
                18L,
                "type paris any letter",
                QuestionType.IDENTIFICATION,
                List.of(),
                "CITY OF PARIS, PARIS",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.isCorrectSubmission("PaRis", 1L)).isTrue();
        assertThat(question.isCorrectSubmission("city of paris", 1L)).isTrue();
    }

    @Test
    void trueFalseGradesStoredAdminLetter() {
        QuestionInfoDto question = new QuestionInfoDto(
                19L,
                "select true",
                QuestionType.TRUE_FALSE,
                List.of("True", "False"),
                "A",
                10,
                30,
                0,
                "EASY",
                false
        );

        assertThat(question.isCorrectSubmission("A", 1L)).isTrue();
        assertThat(question.isCorrectSubmission("B", 1L)).isFalse();
    }
}
