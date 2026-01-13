package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.ports.QuizRepository;
import net.jqwik.api.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for QuizSessionService.
 * 
 * Feature: application-layer, Property 2: Single Active Session Invariant
 * Validates: Requirements 3.1, 3.2, 3.3
 */
public class QuizSessionPropertyTest {

    /**
     * Property 2: Single Active Session Invariant
     * When activating a quiz, any other active quiz must be deactivated.
     */
    @Property(tries = 20)
    void activatingQuizDeactivatesOtherActiveQuizzes(@ForAll("quizCounts") int quizCount) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        // Create multiple quizzes, one is currently active
        List<Quiz> allQuizzes = new ArrayList<>();
        Quiz currentlyActiveQuiz = createReadyQuiz(1L, "Active Quiz", true);
        allQuizzes.add(currentlyActiveQuiz);
        
        for (int i = 2; i <= quizCount; i++) {
            allQuizzes.add(createReadyQuiz((long) i, "Quiz " + i, false));
        }
        
        // Quiz to activate
        Quiz quizToActivate = allQuizzes.get(quizCount - 1);
        
        when(quizRepository.findById(quizToActivate.getId())).thenReturn(Optional.of(quizToActivate));
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of(currentlyActiveQuiz));
        when(quizRepository.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));
        
        QuizSessionService service = new QuizSessionService(quizRepository);
        Quiz result = service.activateSession(quizToActivate.getId());
        
        // Verify the previously active quiz was deactivated
        assertThat(currentlyActiveQuiz.isLiveSession()).isFalse();
        
        // Verify the new quiz is active
        assertThat(result.isLiveSession()).isTrue();
    }

    /**
     * Property 2: Deactivating a session sets isLiveSession to false
     */
    @Property(tries = 20)
    void deactivatingSessionSetsLiveSessionToFalse(@ForAll("validTitles") String title) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz activeQuiz = createReadyQuiz(1L, title, true);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(activeQuiz));
        when(quizRepository.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));
        
        QuizSessionService service = new QuizSessionService(quizRepository);
        Quiz result = service.deactivateSession(1L);
        
        assertThat(result.isLiveSession()).isFalse();
    }

    /**
     * Property 2: getActiveSession returns the currently active quiz
     */
    @Property(tries = 20)
    void getActiveSessionReturnsActiveQuiz(@ForAll("validTitles") String title) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz activeQuiz = createReadyQuiz(1L, title, true);
        
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of(activeQuiz));
        
        QuizSessionService service = new QuizSessionService(quizRepository);
        Optional<Quiz> result = service.getActiveSession();
        
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
    }

    /**
     * Property 2: getActiveSession returns empty when no quiz is active
     */
    @Property(tries = 5)
    void getActiveSessionReturnsEmptyWhenNoActiveQuiz() {
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of());
        
        QuizSessionService service = new QuizSessionService(quizRepository);
        Optional<Quiz> result = service.getActiveSession();
        
        assertThat(result).isEmpty();
    }

    /**
     * Property 2: Activating the same quiz twice doesn't cause issues
     */
    @Property(tries = 20)
    void activatingSameQuizTwiceIsIdempotent(@ForAll("validTitles") String title) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz quiz = createReadyQuiz(1L, title, true);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of(quiz));
        when(quizRepository.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));
        
        QuizSessionService service = new QuizSessionService(quizRepository);
        Quiz result = service.activateSession(1L);
        
        // Quiz should still be active
        assertThat(result.isLiveSession()).isTrue();
    }

    @Provide
    Arbitrary<Integer> quizCounts() {
        return Arbitraries.integers().between(2, 5);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    private Quiz createReadyQuiz(Long id, String title, boolean isLive) {
        Quiz quiz = new Quiz(title, "Description", "123-456", QuizStatus.READY);
        quiz.setId(id);
        quiz.setLiveSession(isLive);
        
        // Add a question so it can be activated
        Question question = new Question(quiz, "Question?", QuestionType.MULTIPLE_CHOICE, 
                Difficulty.EASY, "A");
        quiz.addQuestion(question);
        
        return quiz;
    }
}
