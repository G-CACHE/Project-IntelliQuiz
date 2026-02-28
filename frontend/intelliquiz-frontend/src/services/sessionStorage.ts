// Session Storage Utilities for Proctor and Participant Sessions

export type SessionRole = 'PROCTOR' | 'PARTICIPANT';

export interface ProctorSession {
  role: 'PROCTOR';
  quizId: number;
  quizTitle: string;
  proctorPin: string;
}

export interface ParticipantSession {
  role: 'PARTICIPANT';
  quizId: number;
  teamId: number;
  teamName: string;
  teamCode: string;
}

export type GameSession = ProctorSession | ParticipantSession;

const SESSION_KEY = 'intelliquiz_session';

/**
 * Save a proctor session to sessionStorage
 */
export const saveProctorSession = (
  quizId: number,
  quizTitle: string,
  proctorPin: string
): ProctorSession => {
  const session: ProctorSession = {
    role: 'PROCTOR',
    quizId,
    quizTitle,
    proctorPin,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Save a participant session to sessionStorage
 */
export const saveParticipantSession = (
  quizId: number,
  teamId: number,
  teamName: string,
  teamCode: string
): ParticipantSession => {
  const session: ParticipantSession = {
    role: 'PARTICIPANT',
    quizId,
    teamId,
    teamName,
    teamCode,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Get the current session from sessionStorage
 */
export const getSession = (): GameSession | null => {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as GameSession;
  } catch {
    return null;
  }
};


/**
 * Get the current session as a proctor session (type guard)
 */
export const getProctorSession = (): ProctorSession | null => {
  const session = getSession();
  if (session?.role === 'PROCTOR') {
    return session;
  }
  return null;
};

/**
 * Get the current session as a participant session (type guard)
 */
export const getParticipantSession = (): ParticipantSession | null => {
  const session = getSession();
  if (session?.role === 'PARTICIPANT') {
    return session;
  }
  return null;
};

/**
 * Clear the current session from sessionStorage
 */
export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

/**
 * Check if a session exists
 */
export const hasSession = (): boolean => {
  return sessionStorage.getItem(SESSION_KEY) !== null;
};

/**
 * Check if the current session is a proctor session
 */
export const isProctorSession = (): boolean => {
  const session = getSession();
  return session?.role === 'PROCTOR';
};

/**
 * Check if the current session is a participant session
 */
export const isParticipantSession = (): boolean => {
  const session = getSession();
  return session?.role === 'PARTICIPANT';
};

/**
 * Get the quiz ID from the current session
 */
export const getQuizId = (): number | null => {
  const session = getSession();
  return session?.quizId ?? null;
};

/**
 * Get the team ID from the current session (participant only)
 */
export const getTeamId = (): number | null => {
  const session = getParticipantSession();
  return session?.teamId ?? null;
};
