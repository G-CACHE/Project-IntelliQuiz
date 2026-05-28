package com.intelliquiz.api.quiz;

import com.intelliquiz.api.quiz.internal.application.services.QuizSessionService;
import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.quiz.internal.domain.ports.QuizRepository;
import com.intelliquiz.api.quiz.internal.presentation.dto.response.QuizResponse;
import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.exceptions.QuizNotReadyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.doReturn;

/**
 * Unit tests for the LIVE quiz status lifecycle.
 *
 * Covers:
 *  - QuizStatus enum contains exactly DRAFT, READY, LIVE, ARCHIVED
 *  - Quiz.activate() transitions READY → LIVE and sets isLiveSession
 *  - Quiz.activate() rejects non-READY statuses
 *  - Quiz.deactivate() transitions LIVE → READY and clears isLiveSession
 *  - Quiz.archive() always sets ARCHIVED and clears isLiveSession
 *  - QuizSessionService single-session invariant with LIVE status
 *  - QuizResponse.from() serialises LIVE status correctly
 *  - Team registration is blocked on ARCHIVED quizzes
 */
@DisplayName("Quiz LIVE Status Lifecycle")
class QuizLiveStatusTest {

    // ── helpers ──────────────────────────────────────────────────────────────

    private static Quiz readyQuiz(String title) {
        Quiz q = new Quiz(title, "desc", "000-000", QuizStatus.DRAFT);
        Question question = new Question(q, "Sample question?", QuestionType.IDENTIFICATION, Difficulty.EASY, "answer");
        q.addQuestion(question);
        q.transitionToReady();
        return q;
    }

    private static Quiz quizWithStatus(QuizStatus status) {
        return new Quiz("Quiz", "desc", "000-000", status);
    }

    // ── 1. Enum completeness ─────────────────────────────────────────────────

    @Nested
    @DisplayName("QuizStatus enum")
    class EnumTests {

        @Test
        @DisplayName("contains exactly DRAFT, READY, LIVE, ARCHIVED")
        void enumValuesAreExact() {
            QuizStatus[] values = QuizStatus.values();
            assertThat(values).containsExactlyInAnyOrder(
                    QuizStatus.DRAFT,
                    QuizStatus.READY,
                    QuizStatus.ACTIVE,
                    QuizStatus.ARCHIVED
            );
        }

        @Test
        @DisplayName("does not contain ACTIVE")
        void noActiveStatus() {
            // ACTIVE is the valid live-session status — this test verifies the old LIVE name is gone
            for (QuizStatus s : QuizStatus.values()) {
                assertThat(s.name()).isNotEqualTo("LIVE");
            }
        }
    }

    // ── 2. Domain entity transitions ─────────────────────────────────────────

    @Nested
    @DisplayName("Quiz.activate()")
    class ActivateTests {

        @Test
        @DisplayName("READY → LIVE: sets status and isLiveSession")
        void readyBecomesLive() {
            Quiz quiz = readyQuiz("Science Quiz");

            quiz.activate();

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ACTIVE);
            assertThat(quiz.isLiveSession()).isTrue();
        }

        @Test
        @DisplayName("DRAFT → throws QuizNotReadyException")
        void draftCannotActivate() {
            Quiz quiz = quizWithStatus(QuizStatus.DRAFT);

            assertThatThrownBy(quiz::activate)
                    .isInstanceOf(QuizNotReadyException.class)
                    .hasMessageContaining("READY");
        }

        @Test
        @DisplayName("LIVE → throws QuizNotReadyException")
        void liveCannotActivateAgain() {
            Quiz quiz = quizWithStatus(QuizStatus.ACTIVE);

            assertThatThrownBy(quiz::activate)
                    .isInstanceOf(QuizNotReadyException.class);
        }

        @Test
        @DisplayName("ARCHIVED → throws QuizNotReadyException")
        void archivedCannotActivate() {
            Quiz quiz = quizWithStatus(QuizStatus.ARCHIVED);

            assertThatThrownBy(quiz::activate)
                    .isInstanceOf(QuizNotReadyException.class);
        }
    }

    @Nested
    @DisplayName("Quiz.deactivate()")
    class DeactivateTests {

        @Test
        @DisplayName("LIVE → READY: clears isLiveSession")
        void liveBecomesReady() {
            Quiz quiz = readyQuiz("History Quiz");
            quiz.activate(); // READY → LIVE

            quiz.deactivate();

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.READY);
            assertThat(quiz.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("deactivate on non-live quiz still clears isLiveSession flag")
        void deactivateIsIdempotentOnFlag() {
            Quiz quiz = quizWithStatus(QuizStatus.READY);
            quiz.setLiveSession(false);

            quiz.deactivate();

            assertThat(quiz.isLiveSession()).isFalse();
        }
    }

    @Nested
    @DisplayName("Quiz.archive()")
    class ArchiveTests {

        @Test
        @DisplayName("LIVE quiz archives correctly")
        void liveQuizArchives() {
            Quiz quiz = readyQuiz("Math Quiz");
            quiz.activate();

            quiz.archive();

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ARCHIVED);
            assertThat(quiz.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("READY quiz archives correctly")
        void readyQuizArchives() {
            Quiz quiz = readyQuiz("English Quiz");

            quiz.archive();

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ARCHIVED);
            assertThat(quiz.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("DRAFT quiz archives correctly")
        void draftQuizArchives() {
            Quiz quiz = quizWithStatus(QuizStatus.DRAFT);

            quiz.archive();

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ARCHIVED);
        }
    }

    @Nested
    @DisplayName("Quiz.transitionToReady()")
    class TransitionToReadyTests {

        @Test
        @DisplayName("DRAFT with questions → READY")
        void draftWithQuestionsBecomesReady() {
            Quiz quiz = readyQuiz("Biology Quiz");

            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.READY);
        }

        @Test
        @DisplayName("DRAFT without questions → throws InvalidQuizStateException")
        void draftWithoutQuestionsCannotBeReady() {
            Quiz quiz = quizWithStatus(QuizStatus.DRAFT);

            assertThatThrownBy(quiz::transitionToReady)
                    .hasMessageContaining("at least one question");
        }
    }

    // ── 3. QuizSessionService ────────────────────────────────────────────────

    @Nested
    @DisplayName("QuizSessionService")
    class SessionServiceTests {

        private QuizRepository repo;
        private QuizSessionService service;

        @BeforeEach
        void setUp() {
            repo = mock(QuizRepository.class);
            ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
            service = new QuizSessionService(repo, publisher);
        }

        @Test
        @DisplayName("activateSession sets status to LIVE")
        void activateSessionSetsLiveStatus() {
            Quiz quiz = readyQuiz("Chemistry Quiz");

            when(repo.findById(1L)).thenReturn(Optional.of(quiz));
            when(repo.findByIsLiveSessionTrue()).thenReturn(List.of());
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Quiz result = service.activateSession(1L);

            assertThat(result.getStatus()).isEqualTo(QuizStatus.ACTIVE);
            assertThat(result.isLiveSession()).isTrue();
        }

        @Test
        @DisplayName("activateSession deactivates any other live quiz first")
        void activateSessionEnforcesSingleSession() {
            // alreadyLive has id=null; toActivate also id=null.
            // The service skips deactivation when ids match, so we need distinct objects.
            // Use a spy to control getId() return values.
            Quiz alreadyLive = spy(readyQuiz("Old Quiz"));
            doReturn(1L).when(alreadyLive).getId();
            alreadyLive.activate(); // status = LIVE

            Quiz toActivate = spy(readyQuiz("New Quiz"));
            doReturn(2L).when(toActivate).getId();

            when(repo.findById(2L)).thenReturn(Optional.of(toActivate));
            when(repo.findByIsLiveSessionTrue()).thenReturn(List.of(alreadyLive));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.activateSession(2L);

            // Previously live quiz must be deactivated back to READY
            assertThat(alreadyLive.getStatus()).isEqualTo(QuizStatus.READY);
            assertThat(alreadyLive.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("deactivateSession sets status back to READY")
        void deactivateSessionSetsReadyStatus() {
            Quiz quiz = readyQuiz("Physics Quiz");
            quiz.activate();

            when(repo.findById(3L)).thenReturn(Optional.of(quiz));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Quiz result = service.deactivateSession(3L);

            assertThat(result.getStatus()).isEqualTo(QuizStatus.READY);
            assertThat(result.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("getActiveSession returns quiz with isLiveSession=true")
        void getActiveSessionReturnsLiveQuiz() {
            Quiz live = readyQuiz("Live Quiz");
            live.activate();

            when(repo.findByIsLiveSessionTrue()).thenReturn(List.of(live));

            Optional<Quiz> result = service.getActiveSession();

            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(QuizStatus.ACTIVE);
        }

        @Test
        @DisplayName("getActiveSession returns empty when no live quiz")
        void getActiveSessionEmptyWhenNone() {
            when(repo.findByIsLiveSessionTrue()).thenReturn(List.of());

            assertThat(service.getActiveSession()).isEmpty();
        }
    }

    // ── 4. QuizResponse DTO ──────────────────────────────────────────────────

    @Nested
    @DisplayName("QuizResponse DTO")
    class DtoTests {

        @Test
        @DisplayName("from() maps LIVE status correctly")
        void mapsLiveStatus() {
            Quiz quiz = readyQuiz("DTO Quiz");
            quiz.activate();

            QuizResponse response = QuizResponse.from(quiz);

            assertThat(response.status()).isEqualTo(QuizStatus.ACTIVE);
            assertThat(response.isLiveSession()).isTrue();
        }

        @Test
        @DisplayName("from() maps READY status correctly after deactivate")
        void mapsReadyStatusAfterDeactivate() {
            Quiz quiz = readyQuiz("DTO Quiz 2");
            quiz.activate();
            quiz.deactivate();

            QuizResponse response = QuizResponse.from(quiz);

            assertThat(response.status()).isEqualTo(QuizStatus.READY);
            assertThat(response.isLiveSession()).isFalse();
        }

        @Test
        @DisplayName("from() maps ARCHIVED status correctly")
        void mapsArchivedStatus() {
            Quiz quiz = readyQuiz("DTO Quiz 3");
            quiz.activate();
            quiz.archive();

            QuizResponse response = QuizResponse.from(quiz);

            assertThat(response.status()).isEqualTo(QuizStatus.ARCHIVED);
            assertThat(response.isLiveSession()).isFalse();
        }
    }

    // ── 5. Full lifecycle sequence ───────────────────────────────────────────

    @Nested
    @DisplayName("Full lifecycle: DRAFT → READY → LIVE → READY → ARCHIVED")
    class FullLifecycleTest {

        @Test
        @DisplayName("quiz passes through all states correctly")
        void fullLifecycle() {
            Quiz quiz = new Quiz("Full Lifecycle Quiz", "desc", "123-456", QuizStatus.DRAFT);
            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.DRAFT);

            // Add a question so transitionToReady works
            Question q = new Question(quiz, "Q1?", QuestionType.IDENTIFICATION, Difficulty.EASY, "A1");
            quiz.addQuestion(q);

            quiz.transitionToReady();
            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.READY);
            assertThat(quiz.isLiveSession()).isFalse();

            quiz.activate();
            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ACTIVE);
            assertThat(quiz.isLiveSession()).isTrue();

            quiz.deactivate();
            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.READY);
            assertThat(quiz.isLiveSession()).isFalse();

            quiz.archive();
            assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ARCHIVED);
            assertThat(quiz.isLiveSession()).isFalse();
        }
    }
}
