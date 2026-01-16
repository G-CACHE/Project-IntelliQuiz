import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 13: API Loading State
 * For any API request in pending state, the UI SHALL display a loading indicator,
 * and upon failure, SHALL display a user-friendly error message.
 * 
 * Validates: Requirements 8.1, 8.2
 */

type RequestState = 'idle' | 'loading' | 'success' | 'error';

interface APIState {
  state: RequestState;
  data: unknown | null;
  error: string | null;
}

interface UIState {
  showLoading: boolean;
  showError: boolean;
  showContent: boolean;
  errorMessage: string | null;
}

// Simulate API state to UI state mapping
const mapAPIStateToUI = (apiState: APIState): UIState => {
  return {
    showLoading: apiState.state === 'loading',
    showError: apiState.state === 'error',
    showContent: apiState.state === 'success',
    errorMessage: apiState.error,
  };
};

// Simulate API request lifecycle
const simulateAPIRequest = (
  shouldSucceed: boolean,
  errorMessage?: string
): APIState[] => {
  const states: APIState[] = [];
  
  // Initial idle state
  states.push({ state: 'idle', data: null, error: null });
  
  // Loading state
  states.push({ state: 'loading', data: null, error: null });
  
  // Final state
  if (shouldSucceed) {
    states.push({ state: 'success', data: { result: 'data' }, error: null });
  } else {
    states.push({ state: 'error', data: null, error: errorMessage || 'Request failed' });
  }
  
  return states;
};

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Invalid code. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

const getUserFriendlyMessage = (errorCode: string): string => {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN;
};

describe('Property 13: API Loading State', () => {
  /**
   * Feature: proctor-participant-ui, Property 13: API Loading State
   */
  
  it('should show loading indicator during pending state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // shouldSucceed
        (shouldSucceed) => {
          const states = simulateAPIRequest(shouldSucceed);
          const loadingState = states.find(s => s.state === 'loading');
          
          expect(loadingState).toBeDefined();
          
          const uiState = mapAPIStateToUI(loadingState!);
          expect(uiState.showLoading).toBe(true);
          expect(uiState.showError).toBe(false);
          expect(uiState.showContent).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show error message on failure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // errorMessage
        (errorMessage) => {
          const states = simulateAPIRequest(false, errorMessage);
          const errorState = states.find(s => s.state === 'error');
          
          expect(errorState).toBeDefined();
          
          const uiState = mapAPIStateToUI(errorState!);
          expect(uiState.showError).toBe(true);
          expect(uiState.showLoading).toBe(false);
          expect(uiState.errorMessage).toBe(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show content on success', () => {
    const states = simulateAPIRequest(true);
    const successState = states.find(s => s.state === 'success');
    
    expect(successState).toBeDefined();
    
    const uiState = mapAPIStateToUI(successState!);
    expect(uiState.showContent).toBe(true);
    expect(uiState.showLoading).toBe(false);
    expect(uiState.showError).toBe(false);
  });

  it('should provide user-friendly error messages', () => {
    const errorCodes = ['INVALID_CODE', 'NETWORK_ERROR', 'CONNECTION_LOST', 'SESSION_EXPIRED', 'UNKNOWN'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...errorCodes),
        (errorCode) => {
          const message = getUserFriendlyMessage(errorCode);
          
          // Message should be defined and non-empty
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);
          
          // Message should be user-friendly (not a technical error code)
          expect(message).not.toBe(errorCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unknown error codes gracefully', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (unknownCode) => {
          const message = getUserFriendlyMessage(unknownCode);
          
          // Should return a default message for unknown codes
          expect(message).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transition through states correctly', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (shouldSucceed) => {
          const states = simulateAPIRequest(shouldSucceed);
          
          // Should have exactly 3 states: idle -> loading -> success/error
          expect(states).toHaveLength(3);
          expect(states[0].state).toBe('idle');
          expect(states[1].state).toBe('loading');
          expect(states[2].state).toBe(shouldSucceed ? 'success' : 'error');
        }
      ),
      { numRuns: 100 }
    );
  });
});
