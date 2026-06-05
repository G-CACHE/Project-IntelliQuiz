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
}
