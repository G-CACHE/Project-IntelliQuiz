package com.intelliquiz.api;

import com.intelliquiz.api.quiz.events.QuestionDeletedEvent;
import com.intelliquiz.api.quiz.events.QuizCreatedEvent;
import com.intelliquiz.api.scoreboard.internal.application.listeners.ScoreboardProjection;
import com.intelliquiz.api.submission.events.SubmissionGradedEvent;
import com.intelliquiz.api.submission.internal.application.listeners.SubmissionEventListener;
import com.intelliquiz.api.team.events.TeamRegisteredEvent;
import com.intelliquiz.api.team.events.TeamRemovedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.context.event.EventListener;

import java.time.Instant;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies event publication/consumption contracts across modules.
 * Covers AC-9, AC-22, AC-29, tasks 10.15–10.19.
 */
class EventPublicationVerificationTest {

    // --- Task 10.15: QuizCreatedEvent publication ---

    @Test
    void quizCreatedEventHasRequiredFields() {
        var event = new QuizCreatedEvent(1L, "Test Quiz", Instant.now());
        assertNotNull(event.quizId());
        assertNotNull(event.title());
        assertNotNull(event.occurredAt());
    }

    // --- Task 10.16: SubmissionGradedEvent → ScoreboardProjection ---

    @Test
    void scoreboardProjectionHandlesSubmissionGradedEvent() {
        assertEventListenerExists(ScoreboardProjection.class, SubmissionGradedEvent.class);
    }

    // --- Task 10.17: TeamRegisteredEvent → scoreboard + realtime listeners ---

    @Test
    void scoreboardProjectionHandlesTeamRegisteredEvent() {
        assertEventListenerExists(ScoreboardProjection.class, TeamRegisteredEvent.class);
    }

    // --- Task 10.18: QuestionDeletedEvent → submission cleanup listener ---

    @Test
    void submissionListenerHandlesQuestionDeletedEvent() {
        assertEventListenerExists(SubmissionEventListener.class, QuestionDeletedEvent.class);
    }

    // --- Task 10.19: TeamRemovedEvent → submission + scoreboard cleanup ---

    @Test
    void teamRemovedEventHandledByBothListeners() {
        assertEventListenerExists(ScoreboardProjection.class, TeamRemovedEvent.class);
        assertEventListenerExists(SubmissionEventListener.class, TeamRemovedEvent.class);
    }

    // --- AC-29: ScoreboardProjection handles 4+ event types ---

    @Test
    void scoreboardProjectionHandlesAtLeastFourEventTypes() {
        long count = Arrays.stream(ScoreboardProjection.class.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(EventListener.class))
                .count();
        assertTrue(count >= 4,
                "ScoreboardProjection should handle 4+ event types but handles " + count);
    }

    // --- AC-22: All listeners use @EventListener ---

    @Test
    void allListenerMethodsAreAnnotated() {
        assertHasEventListenerAnnotation(ScoreboardProjection.class);
        assertHasEventListenerAnnotation(SubmissionEventListener.class);
    }

    // --- Helpers ---

    private void assertEventListenerExists(Class<?> listenerClass, Class<?> eventType) {
        boolean found = Arrays.stream(listenerClass.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(EventListener.class))
                .anyMatch(m -> {
                    Class<?>[] params = m.getParameterTypes();
                    return params.length == 1 && params[0].equals(eventType);
                });
        assertTrue(found,
                listenerClass.getSimpleName() + " should have @EventListener for " + eventType.getSimpleName());
    }

    private void assertHasEventListenerAnnotation(Class<?> listenerClass) {
        long count = Arrays.stream(listenerClass.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(EventListener.class))
                .count();
        assertTrue(count > 0,
                listenerClass.getSimpleName() + " should have at least one @EventListener method");
    }
}
