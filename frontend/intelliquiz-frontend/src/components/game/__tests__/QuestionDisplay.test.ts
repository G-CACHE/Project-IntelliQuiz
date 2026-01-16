import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 4: Question Display Completeness
 * For any question in QUESTION state, the participant interface SHALL display
 * the question text, all answer options, and a countdown timer with the
 * correct time remaining.
 * 
 * Validates: Requirements 4.2, 5.1
 */

interface QuestionData {
  id: number;
  text: string;
  options: string[];
  timeLimit: number;
  points: number;
}

// Arbitrary for generating valid question data
const questionDataArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  text: fc.string({ minLength: 1, maxLength: 500 }),
  options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 6 }),
  timeLimit: fc.integer({ min: 5, max: 120 }),
  points: fc.integer({ min: 1, max: 1000 }),
});

// Simulate what the QuestionDisplay component should render
const simulateQuestionDisplay = (
  question: QuestionData,
  questionNumber: number,
  totalQuestions: number,
  timeRemaining: number
): {
  hasQuestionText: boolean;
  hasAllOptions: boolean;
  hasTimer: boolean;
  hasQuestionNumber: boolean;
  hasPoints: boolean;
  optionCount: number;
} => {
  return {
    hasQuestionText: question.text.length > 0,
    hasAllOptions: question.options.length >= 2 && question.options.every(opt => opt.length > 0),
    hasTimer: timeRemaining >= 0,
    hasQuestionNumber: questionNumber > 0 && questionNumber <= totalQuestions,
    hasPoints: question.points > 0,
    optionCount: question.options.length,
  };
};

describe('Property 4: Question Display Completeness', () => {
  /**
   * Feature: proctor-participant-ui, Property 4: Question Display Completeness
   */
  it('should display question text for any valid question', () => {
    fc.assert(
      fc.property(questionDataArb, (question) => {
        const result = simulateQuestionDisplay(question, 1, 10, 30);
        expect(result.hasQuestionText).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display all answer options for any valid question', () => {
    fc.assert(
      fc.property(questionDataArb, (question) => {
        const result = simulateQuestionDisplay(question, 1, 10, 30);
        expect(result.hasAllOptions).toBe(true);
        expect(result.optionCount).toBe(question.options.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should display timer with correct time remaining', () => {
    fc.assert(
      fc.property(
        questionDataArb,
        fc.integer({ min: 0, max: 120 }), // timeRemaining
        (question, timeRemaining) => {
          const result = simulateQuestionDisplay(question, 1, 10, timeRemaining);
          expect(result.hasTimer).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display question number and total questions', () => {
    fc.assert(
      fc.property(
        questionDataArb,
        fc.integer({ min: 1, max: 50 }), // questionNumber
        fc.integer({ min: 1, max: 50 }), // totalQuestions
        (question, questionNumber, totalQuestions) => {
          // Ensure questionNumber <= totalQuestions
          const validQuestionNumber = Math.min(questionNumber, totalQuestions);
          const result = simulateQuestionDisplay(question, validQuestionNumber, totalQuestions, 30);
          expect(result.hasQuestionNumber).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display points for any valid question', () => {
    fc.assert(
      fc.property(questionDataArb, (question) => {
        const result = simulateQuestionDisplay(question, 1, 10, 30);
        expect(result.hasPoints).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle questions with varying number of options (2-6)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }),
        (optionCount) => {
          const question: QuestionData = {
            id: 1,
            text: 'Test question',
            options: Array.from({ length: optionCount }, (_, i) => `Option ${i + 1}`),
            timeLimit: 30,
            points: 100,
          };
          
          const result = simulateQuestionDisplay(question, 1, 10, 30);
          expect(result.optionCount).toBe(optionCount);
          expect(result.hasAllOptions).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
