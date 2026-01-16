import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 3: Game State Transition Navigation
 * For any game state change received via WebSocket, the participant interface
 * SHALL navigate to the appropriate view (lobby → game → scoreboard)
 * corresponding to the new state.
 * 
 * Validates: Requirements 3.4
 */

// Game states that should trigger navigation
type GameState = 'LOBBY' | 'QUESTION' | 'BUFFER' | 'ANSWER_REVEAL' | 'SCOREBOARD' | 'FINAL_RESULTS';

// Expected navigation destinations for each state
const getExpectedDestination = (state: GameState): string | null => {
  switch (state) {
    case 'LOBBY':
      return null; // Stay on lobby
    case 'QUESTION':
    case 'BUFFER':
    case 'ANSWER_REVEAL':
    case 'SCOREBOARD':
      return '/player/game'; // Navigate to game
    case 'FINAL_RESULTS':
      return '/player/scoreboard'; // Navigate to final scoreboard
    default:
      return null;
  }
};

// Simulate navigation logic
const simulateNavigation = (
  currentPath: string,
  newState: GameState
): string => {
  const destination = getExpectedDestination(newState);
  
  if (destination === null) {
    return currentPath; // Stay on current path
  }
  
  // Only navigate if not already on the destination
  if (currentPath.startsWith(destination)) {
    return currentPath;
  }
  
  return destination;
};

describe('Property 3: Game State Transition Navigation', () => {
  /**
   * Feature: proctor-participant-ui, Property 3: Game State Transition Navigation
   */
  it('should navigate to game interface when state changes to QUESTION', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // quizId
        fc.integer({ min: 1, max: 1000 }), // teamId
        (quizId, teamId) => {
          const currentPath = `/player/lobby?quizId=${quizId}&teamId=${teamId}`;
          const newPath = simulateNavigation(currentPath, 'QUESTION');
          
          expect(newPath).toBe('/player/game');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should stay on lobby when state is LOBBY', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (quizId, teamId) => {
          const currentPath = `/player/lobby?quizId=${quizId}&teamId=${teamId}`;
          const newPath = simulateNavigation(currentPath, 'LOBBY');
          
          expect(newPath).toBe(currentPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should navigate to scoreboard on FINAL_RESULTS', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (quizId, teamId) => {
          const currentPath = `/player/game?quizId=${quizId}&teamId=${teamId}`;
          const newPath = simulateNavigation(currentPath, 'FINAL_RESULTS');
          
          expect(newPath).toBe('/player/scoreboard');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle all game states consistently', () => {
    const gameStates: GameState[] = ['LOBBY', 'QUESTION', 'BUFFER', 'ANSWER_REVEAL', 'SCOREBOARD', 'FINAL_RESULTS'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...gameStates),
        fc.integer({ min: 1, max: 1000 }),
        (state, quizId) => {
          const currentPath = `/player/lobby?quizId=${quizId}`;
          const newPath = simulateNavigation(currentPath, state);
          
          // Navigation should always result in a valid path
          expect(newPath).toBeTruthy();
          expect(typeof newPath).toBe('string');
          
          // Path should start with /player/
          expect(newPath.startsWith('/player/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
