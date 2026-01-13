package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.*;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * jqwik arbitraries for generating random entity instances for property-based testing.
 */
public class EntityArbitraries {

    public static Arbitrary<String> validUsername() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(50);
    }

    public static Arbitrary<String> validPassword() {
        return Arbitraries.strings()
                .ofMinLength(8)
                .ofMaxLength(100);
    }

    public static Arbitrary<SystemRole> systemRole() {
        return Arbitraries.of(SystemRole.class);
    }

    public static Arbitrary<AdminPermission> adminPermission() {
        return Arbitraries.of(AdminPermission.class);
    }

    public static Arbitrary<Set<AdminPermission>> adminPermissionSet() {
        return adminPermission().set().ofMinSize(0).ofMaxSize(4);
    }

    public static Arbitrary<QuizStatus> quizStatus() {
        return Arbitraries.of(QuizStatus.class);
    }

    public static Arbitrary<QuestionType> questionType() {
        return Arbitraries.of(QuestionType.class);
    }

    public static Arbitrary<Difficulty> difficulty() {
        return Arbitraries.of(Difficulty.class);
    }


    public static Arbitrary<String> validTitle() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    public static Arbitrary<String> validDescription() {
        return Arbitraries.strings()
                .ofMinLength(0)
                .ofMaxLength(500);
    }

    public static Arbitrary<String> validProctorPin() {
        return Arbitraries.strings()
                .numeric()
                .ofLength(6);
    }

    public static Arbitrary<String> validQuestionText() {
        return Arbitraries.strings()
                .ofMinLength(5)
                .ofMaxLength(500);
    }

    public static Arbitrary<String> validCorrectKey() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(100);
    }

    public static Arbitrary<Integer> validPoints() {
        return Arbitraries.integers().between(1, 100);
    }

    public static Arbitrary<Integer> validTimeLimit() {
        return Arbitraries.integers().between(10, 300);
    }

    public static Arbitrary<Integer> validOrderIndex() {
        return Arbitraries.integers().between(0, 100);
    }

    public static Arbitrary<List<String>> validOptions() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(100)
                .list()
                .ofMinSize(2)
                .ofMaxSize(6);
    }

    public static Arbitrary<String> validTeamName() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    public static Arbitrary<String> validAccessCode() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofLength(8);
    }

    public static Arbitrary<String> validSubmittedAnswer() {
        return Arbitraries.strings()
                .ofMinLength(1)
                .ofMaxLength(200);
    }

    public static Arbitrary<Boolean> validBoolean() {
        return Arbitraries.of(true, false);
    }

    public static Arbitrary<LocalDateTime> validSubmittedAt() {
        return Arbitraries.longs()
                .between(0, 1000000000L)
                .map(seconds -> LocalDateTime.now().minusSeconds(seconds));
    }


    // Entity Arbitraries

    public static Arbitrary<User> user() {
        return Combinators.combine(
                validUsername(),
                validPassword(),
                systemRole()
        ).as(User::new);
    }

    public static Arbitrary<Quiz> quiz() {
        return Combinators.combine(
                validTitle(),
                validDescription(),
                validProctorPin(),
                quizStatus()
        ).as(Quiz::new);
    }

    public static Arbitrary<Question> questionWithoutQuiz() {
        return Combinators.combine(
                validQuestionText(),
                questionType(),
                difficulty(),
                validCorrectKey(),
                validPoints(),
                validTimeLimit(),
                validOrderIndex(),
                validOptions()
        ).as((text, type, diff, key, points, timeLimit, orderIndex, options) -> {
            Question q = new Question();
            q.setText(text);
            q.setType(type);
            q.setDifficulty(diff);
            q.setCorrectKey(key);
            q.setPoints(points);
            q.setTimeLimit(timeLimit);
            q.setOrderIndex(orderIndex);
            q.setOptions(options);
            return q;
        });
    }

    public static Arbitrary<Team> teamWithoutQuiz() {
        return Combinators.combine(
                validTeamName(),
                validAccessCode()
        ).as((name, accessCode) -> {
            Team t = new Team();
            t.setName(name);
            t.setAccessCode(accessCode);
            t.setTotalScore(0);
            return t;
        });
    }

    public static Arbitrary<Submission> submissionWithoutRelations() {
        return Combinators.combine(
                validSubmittedAnswer(),
                validBoolean(),
                validPoints(),
                validSubmittedAt()
        ).as((answer, isCorrect, points, submittedAt) -> {
            Submission s = new Submission();
            s.setSubmittedAnswer(answer);
            s.setCorrect(isCorrect);
            s.setAwardedPoints(points);
            s.setSubmittedAt(submittedAt);
            return s;
        });
    }
}
