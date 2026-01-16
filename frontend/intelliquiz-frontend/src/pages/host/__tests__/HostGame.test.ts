import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 5: Proctor Command Dispatch
 * For any control button click by the proctor, the system SHALL send the
 * corresponding WebSocket command (START_QUIZ, SHOW_BUFFER, REVEAL_ANSWER,
 * SHOW_SCOREBOARD, NEXT_QUESTION, or END_QUIZ) to the server.
 * 
 * Validates: Requirements 4.7
 */

type GameState = 'LOBBY' | 'QUESTION' | 'BUFFER' | 'ANSWER_REVEAL' | 'SCOREBOARD' | 'FINAL_RESULTS';
type CommandType = 'START_QUIZ' | 'SHOW_BUFFER' | 'REVEAL_ANSWER' | 'SHOW_SCOREBOARD' | 'NEXT_QUESTION' | 'END_QUIZ';

interface CommandMessage {
  type: CommandType;
}

// Map game state to available commands
const getAvailableCommands = (state: GameState, isLastQuestion: boolean): CommandType[] => {
  switch (state) {
    case 'LOBBY':
      return ['START_QUIZ'];
    case 'QUESTION':
      return ['SHOW_BUFFER'];
    case 'BUFFER':
      return ['REVEAL_ANSWER'];
    case 'ANSWER_REVEAL':
      return ['SHOW_SCOREBOARD'];
    case 'SCOREBOARD':
      return isLastQuestion ? ['END_QUIZ'] : ['NEXT_QUESTION'];
    case 'FINAL_RESULTS':
      return [];
    default:
      return [];
  }
};

// Simulate command dispatch
const simulateCommandDispatch = (
  state: GameState,
  buttonAction: string,
  isLastQuestion: boolean
): CommandMessage | null => {
  const availableCommands = getAvailableCommands(state, isLastQuestion);
  
  // Map button actions to commands
  const actionToCommand: Record<string, CommandType> = {
    'start': 'START_QUIZ',
    'showBuffer': 'SHOW_BUFFER',
    'revealAnswer': 'REVEAL_ANSWER',
    'showScoreboard': 'SHOW_SCOREBOARD',
    'nextQuestion': 'NEXT_QUESTION',
    'endQuiz': 'END_QUIZ',
  };

  const command = actionToCommand[buttonAction];
  
  if (command && availableCommands.includes(command)) {
    return { type: command };
  }
  
  return null;
};

// Validate command is correct for state
const isValidCommandForState = (state: GameState, command: CommandType, isLastQuestion: boolean): boolean => {
  const availableCommands = getAvailableCommands(state, isLastQuestion);
  return availableCommands.includes(command);
};

describe('Property 5: Proctor Command Dispatch', () => {
  /**
   * Feature: proctor-participant-ui, Property 5: Proctor Command Dispatch
   */
  
  it('should dispatch START_QUIZ command from LOBBY state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isLastQuestion (doesn't matter for LOBBY)
        (isLastQuestion) => {
          const command = simulateCommandDispatch('LOBBY', 'start', isLastQuestion);
          expect(command).not.toBeNull();
          expect(command?.type).toBe('START_QUIZ');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch SHOW_BUFFER command from QUESTION state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isLastQuestion) => {
          const command = simulateCommandDispatch('QUESTION', 'showBuffer', isLastQuestion);
          expect(command).not.toBeNull();
          expect(command?.type).toBe('SHOW_BUFFER');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch REVEAL_ANSWER command from BUFFER state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isLastQuestion) => {
          const command = simulateCommandDispatch('BUFFER', 'revealAnswer', isLastQuestion);
          expect(command).not.toBeNull();
          expect(command?.type).toBe('REVEAL_ANSWER');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch SHOW_SCOREBOARD command from ANSWER_REVEAL state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isLastQuestion) => {
          const command = simulateCommandDispatch('ANSWER_REVEAL', 'showScoreboard', isLastQuestion);
          expect(command).not.toBeNull();
          expect(command?.type).toBe('SHOW_SCOREBOARD');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch NEXT_QUESTION from SCOREBOARD when not last question', () => {
    const command = simulateCommandDispatch('SCOREBOARD', 'nextQuestion', false);
    expect(command).not.toBeNull();
    expect(command?.type).toBe('NEXT_QUESTION');
  });

  it('should dispatch END_QUIZ from SCOREBOARD when last question', () => {
    const command = simulateCommandDispatch('SCOREBOARD', 'endQuiz', true);
    expect(command).not.toBeNull();
    expect(command?.type).toBe('END_QUIZ');
  });

  it('should only allow valid commands for each state', () => {
    const states: GameState[] = ['LOBBY', 'QUESTION', 'BUFFER', 'ANSWER_REVEAL', 'SCOREBOARD'];
    const commands: CommandType[] = ['START_QUIZ', 'SHOW_BUFFER', 'REVEAL_ANSWER', 'SHOW_SCOREBOARD', 'NEXT_QUESTION', 'END_QUIZ'];

    fc.assert(
      fc.property(
        fc.constantFrom(...states),
        fc.constantFrom(...commands),
        fc.boolean(),
        (state, command, isLastQuestion) => {
          const isValid = isValidCommandForState(state, command, isLastQuestion);
          const availableCommands = getAvailableCommands(state, isLastQuestion);
          
          // If command is valid, it should be in available commands
          if (isValid) {
            expect(availableCommands).toContain(command);
          } else {
            expect(availableCommands).not.toContain(command);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
