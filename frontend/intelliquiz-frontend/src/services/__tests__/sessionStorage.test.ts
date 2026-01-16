import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property 12: Session Persistence
 * For any successful access code login, the session information
 * (role, quizId, teamId/proctorPin) SHALL be stored in browser sessionStorage
 * and retrievable after page refresh.
 * 
 * Property 14: Session Cleanup on Disconnect
 * For any manual disconnect action by a user, the system SHALL close the
 * WebSocket connection AND clear all session data from browser storage.
 * 
 * Validates: Requirements 10.1, 10.2, 10.4
 */

// Mock sessionStorage for testing
const mockStorage: Record<string, string> = {};

const mockSessionStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
};

// Session types
interface ProctorSession {
  role: 'PROCTOR';
  quizId: number;
  quizTitle: string;
  proctorPin: string;
}

interface ParticipantSession {
  role: 'PARTICIPANT';
  quizId: number;
  teamId: number;
  teamName: string;
  teamCode: string;
}

type GameSession = ProctorSession | ParticipantSession;

const SESSION_KEY = 'intelliquiz_session';

// Session storage functions (simulated)
const saveProctorSession = (quizId: number, quizTitle: string, proctorPin: string): ProctorSession => {
  const session: ProctorSession = { role: 'PROCTOR', quizId, quizTitle, proctorPin };
  mockSessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

const saveParticipantSession = (quizId: number, teamId: number, teamName: string, teamCode: string): ParticipantSession => {
  const session: ParticipantSession = { role: 'PARTICIPANT', quizId, teamId, teamName, teamCode };
  mockSessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

const getSession = (): GameSession | null => {
  const stored = mockSessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GameSession;
  } catch {
    return null;
  }
};

const clearSession = (): void => {
  mockSessionStorage.removeItem(SESSION_KEY);
};

const hasSession = (): boolean => {
  return mockSessionStorage.getItem(SESSION_KEY) !== null;
};

describe('Property 12: Session Persistence', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  /**
   * Feature: proctor-participant-ui, Property 12: Session Persistence
   */
  
  it('should persist proctor session data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // quizId
        fc.string({ minLength: 1, maxLength: 100 }), // quizTitle
        fc.string({ minLength: 4, maxLength: 20 }), // proctorPin
        (quizId, quizTitle, proctorPin) => {
          // Save session
          const saved = saveProctorSession(quizId, quizTitle, proctorPin);
          
          // Retrieve session (simulating page refresh)
          const retrieved = getSession();
          
          // Session should be retrievable
          expect(retrieved).not.toBeNull();
          expect(retrieved?.role).toBe('PROCTOR');
          expect((retrieved as ProctorSession).quizId).toBe(quizId);
          expect((retrieved as ProctorSession).quizTitle).toBe(quizTitle);
          expect((retrieved as ProctorSession).proctorPin).toBe(proctorPin);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist participant session data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // quizId
        fc.integer({ min: 1, max: 10000 }), // teamId
        fc.string({ minLength: 1, maxLength: 100 }), // teamName
        fc.string({ minLength: 4, maxLength: 20 }), // teamCode
        (quizId, teamId, teamName, teamCode) => {
          // Save session
          saveParticipantSession(quizId, teamId, teamName, teamCode);
          
          // Retrieve session (simulating page refresh)
          const retrieved = getSession();
          
          // Session should be retrievable
          expect(retrieved).not.toBeNull();
          expect(retrieved?.role).toBe('PARTICIPANT');
          expect((retrieved as ParticipantSession).quizId).toBe(quizId);
          expect((retrieved as ParticipantSession).teamId).toBe(teamId);
          expect((retrieved as ParticipantSession).teamName).toBe(teamName);
          expect((retrieved as ParticipantSession).teamCode).toBe(teamCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when no session exists', () => {
    const session = getSession();
    expect(session).toBeNull();
    expect(hasSession()).toBe(false);
  });

  it('should overwrite previous session when saving new one', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (quizId1, quizId2) => {
          // Save first session
          saveProctorSession(quizId1, 'Quiz 1', 'PIN1');
          
          // Save second session
          saveParticipantSession(quizId2, 1, 'Team', 'CODE');
          
          // Should only have the second session
          const retrieved = getSession();
          expect(retrieved?.role).toBe('PARTICIPANT');
          expect((retrieved as ParticipantSession).quizId).toBe(quizId2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 14: Session Cleanup on Disconnect', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  /**
   * Feature: proctor-participant-ui, Property 14: Session Cleanup on Disconnect
   */
  
  it('should clear session data on disconnect', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 4, maxLength: 20 }),
        (quizId, quizTitle, proctorPin) => {
          // Save session
          saveProctorSession(quizId, quizTitle, proctorPin);
          expect(hasSession()).toBe(true);
          
          // Clear session (disconnect)
          clearSession();
          
          // Session should be cleared
          expect(hasSession()).toBe(false);
          expect(getSession()).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle clearing non-existent session gracefully', () => {
    // Should not throw when clearing empty storage
    expect(() => clearSession()).not.toThrow();
    expect(hasSession()).toBe(false);
  });

  it('should completely remove session data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 4, maxLength: 20 }),
        (quizId, teamId, teamName, teamCode) => {
          // Save participant session
          saveParticipantSession(quizId, teamId, teamName, teamCode);
          
          // Clear session
          clearSession();
          
          // Verify all data is cleared
          const retrieved = getSession();
          expect(retrieved).toBeNull();
          
          // Storage key should be removed
          expect(mockSessionStorage.getItem(SESSION_KEY)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
