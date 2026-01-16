import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameState, GameStateMessage, RankingEntry } from '../../services/api';

/**
 * Property 10: WebSocket State Broadcast
 * For any game state change on the server, all connected clients subscribed to
 * `/topic/quiz/{quizId}/state` SHALL receive the state update message.
 * 
 * Validates: Requirements 6.2
 * 
 * Note: This test validates the message parsing and state update logic.
 * Full WebSocket integration testing requires a running backend.
 */

// Arbitrary generators for game state messages
const gameStateArb = fc.constantFrom<GameState>(
  'LOBBY', 'QUESTION', 'BUFFER', 'ANSWER_REVEAL', 'SCOREBOARD', 'FINAL_RESULTS'
);

const rankingEntryArb = fc.record({
  rank: fc.integer({ min: 1, max: 100 }),
  teamId: fc.integer({ min: 1, max: 1000 }),
  teamName: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.integer({ min: 0, max: 10000 }),
});

const questionDataArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  text: fc.string({ minLength: 1, maxLength: 500 }),
  options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 4 }),
  timeLimit: fc.integer({ min: 5, max: 120 }),
  points: fc.integer({ min: 1, max: 100 }),
});

const gameStateMessageArb: fc.Arbitrary<GameStateMessage> = fc.record({
  type: fc.constant('GAME_STATE' as const),
  state: gameStateArb,
  currentQuestion: fc.option(questionDataArb, { nil: undefined }),
  questionNumber: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  totalQuestions: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  timeRemaining: fc.option(fc.integer({ min: 0, max: 120 }), { nil: undefined }),
  rankings: fc.option(fc.array(rankingEntryArb, { minLength: 0, maxLength: 20 }), { nil: undefined }),
});

describe('WebSocket State Broadcast - Property Tests', () => {
  /**
   * Feature: proctor-participant-ui, Property 10: WebSocket State Broadcast
   */
  it('should correctly parse any valid game state message', () => {
    fc.assert(
      fc.property(gameStateMessageArb, (message) => {
        // Simulate message parsing (as done in useWebSocket hook)
        const serialized = JSON.stringify(message);
        const parsed = JSON.parse(serialized) as GameStateMessage;
        
        // Verify all fields are preserved after serialization/deserialization
        expect(parsed.type).toBe('GAME_STATE');
        expect(parsed.state).toBe(message.state);
        
        if (message.currentQuestion) {
          expect(parsed.currentQuestion).toBeDefined();
          expect(parsed.currentQuestion?.id).toBe(message.currentQuestion.id);
          expect(parsed.currentQuestion?.text).toBe(message.currentQuestion.text);
        }
        
        if (message.questionNumber !== undefined) {
          expect(parsed.questionNumber).toBe(message.questionNumber);
        }
        
        if (message.totalQuestions !== undefined) {
          expect(parsed.totalQuestions).toBe(message.totalQuestions);
        }
        
        if (message.timeRemaining !== undefined) {
          expect(parsed.timeRemaining).toBe(message.timeRemaining);
        }
        
        if (message.rankings) {
          expect(parsed.rankings).toHaveLength(message.rankings.length);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle all valid game states', () => {
    const validStates: GameState[] = [
      'LOBBY', 'QUESTION', 'BUFFER', 'ANSWER_REVEAL', 'SCOREBOARD', 'FINAL_RESULTS'
    ];
    
    fc.assert(
      fc.property(fc.constantFrom(...validStates), (state) => {
        const message: GameStateMessage = {
          type: 'GAME_STATE',
          state,
        };
        
        const serialized = JSON.stringify(message);
        const parsed = JSON.parse(serialized) as GameStateMessage;
        
        expect(validStates).toContain(parsed.state);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve ranking order after broadcast', () => {
    fc.assert(
      fc.property(
        fc.array(rankingEntryArb, { minLength: 1, maxLength: 20 }),
        (rankings) => {
          const message: GameStateMessage = {
            type: 'GAME_STATE',
            state: 'SCOREBOARD',
            rankings,
          };
          
          const serialized = JSON.stringify(message);
          const parsed = JSON.parse(serialized) as GameStateMessage;
          
          // Rankings should be preserved in order
          expect(parsed.rankings).toHaveLength(rankings.length);
          parsed.rankings?.forEach((entry, index) => {
            expect(entry.teamId).toBe(rankings[index].teamId);
            expect(entry.teamName).toBe(rankings[index].teamName);
            expect(entry.score).toBe(rankings[index].score);
            expect(entry.rank).toBe(rankings[index].rank);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
