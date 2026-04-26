// IntelliQuiz API Service
// Cookie-only auth: every request sends credentials (HttpOnly cookie) automatically.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };

/**
 * Thin wrapper around fetch that always sends credentials (cookies).
 */
const apiFetch = (url: string, init?: RequestInit): Promise<Response> =>
  fetch(url, { ...init, credentials: 'include' });

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text);
};

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ role: string; username: string }>(response);
  },

  logout: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Logout failed');
  },
};

// Access Code Resolution API (Public - no auth required)
export const accessApi = {
  resolveCode: async (code: string, deviceId?: string): Promise<AccessResolutionResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/api/access/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId }),
    });
    return handleResponse<AccessResolutionResponse>(response);
  },

  joinPublicQuiz: async (quizId: number, name: string, deviceId?: string): Promise<AccessResolutionResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/api/access/quizzes/${quizId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, deviceId }),
    });
    return handleResponse<AccessResolutionResponse>(response);
  },

  checkParticipantAccess: async (quizId: number, teamId: number, deviceId?: string): Promise<ParticipantAccessCheckResponse> => {
    const params = new URLSearchParams();
    params.set('teamId', String(teamId));
    if (deviceId) {
      params.set('deviceId', deviceId);
    }

    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/participant-access?${params.toString()}`, {
      method: 'GET',
      headers: JSON_HEADERS,
    });

    return handleResponse<ParticipantAccessCheckResponse>(response);
  },

  updateTeamName: async (teamId: number, newName: string, accessCode: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/api/access/teams/${teamId}/name`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: newName, accessCode }),
    });
    return handleResponse<void>(response);
  },
};

// Current User API (for fetching own info and assignments)
export const currentUserApi = {
  getMe: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/me`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<User>(response);
  },

  getMyAssignments: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/me/assignments`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<QuizAssignment[]>(response);
  },
};

// Users API (SUPER_ADMIN only)
export const usersApi = {
  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/users`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<User[]>(response);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<User>(response);
  },

  getUserAssignments: async (userId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${userId}/assignments`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<QuizAssignment[]>(response);
  },

  create: async (data: CreateUserRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  update: async (id: number, data: UpdateUserRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  assignPermissions: async (userId: number, data: AssignPermissionsRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${userId}/permissions`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<void>(response);
  },

  revokePermissions: async (userId: number, quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/users/${userId}/permissions/${quizId}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },
};

// Quizzes API
export const quizzesApi = {
  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz[]>(response);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  getActive: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/active`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  create: async (data: CreateQuizRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Quiz>(response);
  },

  update: async (id: number, data: UpdateQuizRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Quiz>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  markReady: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}/ready`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  markDraft: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}/draft`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  activate: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}/activate`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  deactivate: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}/deactivate`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },

  archive: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${id}/archive`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<Quiz>(response);
  },
};

// Quiz runtime control API
export const quizControlApi = {
  start: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/start`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<CommandResponse>(response);
  },

  command: async (quizId: number, command: CommandMessage) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/command`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(command),
    });
    return handleResponse<CommandResponse>(response);
  },

  state: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/state`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<QuizRuntimeState>(response);
  },
};

// Questions API
export const questionsApi = {
  getByQuiz: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Question[]>(response);
  },

  create: async (quizId: number, data: CreateQuestionRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  update: async (id: number, data: UpdateQuestionRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  reorder: async (quizId: number, questionIds: number[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions/reorder`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ questionIds }),
    });
    return handleResponse<void>(response);
  },
};

// Teams API
export const teamsApi = {
  getByQuiz: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Team[]>(response);
  },

  register: async (quizId: number, data: RegisterTeamRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Team>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/teams/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  resetScores: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams/reset-scores`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },
};

// Scoreboard API
export const scoreboardApi = {
  getByQuiz: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/scoreboard`, {
      headers: JSON_HEADERS,
    });
    const payload = await handleResponse<ScoreboardEntry[] | { entries?: ScoreboardEntry[] }>(response);
    if (Array.isArray(payload)) {
      return payload;
    }
    return Array.isArray(payload?.entries) ? payload.entries : [];
  },
};

// Backups API (SUPER_ADMIN only)
export const backupsApi = {
  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<BackupRecord[]>(response);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups/${id}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<BackupRecord>(response);
  },

  create: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<BackupRecord>(response);
  },

  restore: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups/${id}/restore`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<BackupRecord>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  download: async (id: number): Promise<Blob> => {
    const response = await apiFetch(`${API_BASE_URL}/api/backups/${id}/download`);
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  },
};

// Submissions API
export const submissionsApi = {
  getByTeam: async (teamId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/teams/${teamId}/submissions`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<Submission[]>(response);
  },

  submit: async (data: SubmitAnswerRequest) => {
    const response = await apiFetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(response);
  },
};

export const quizResultsApi = {
  getParticipantResults: async (quizId: number, teamId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/participant-results?teamId=${teamId}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<ParticipantQuestionResult[]>(response);
  },
};

export const violationApi = {
  getHistory: async (quizId: number, options?: { teamId?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.teamId) {
      params.set('teamId', String(options.teamId));
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }
    const query = params.toString();
    const response = await apiFetch(`${API_BASE_URL}/api/quiz/${quizId}/violations${query ? `?${query}` : ''}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<ViolationLogRecord[]>(response);
  },
};

// Types
export type SystemRole = 'ADMIN' | 'SUPER_ADMIN' | 'EXAMINER' | 'PROCTOR' | 'PARTICIPANT';

export interface User {
  id: number;
  username: string;
  role: SystemRole;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: SystemRole;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
}

export interface AssignPermissionsRequest {
  quizId: number;
  permissions: string[];
}

export type NavigationMode = 'TOURNAMENT' | 'CLASS';

export interface Quiz {
  id: number;
  title: string;
  description: string;
  quizCode?: string;
  proctorPin: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  questionCount?: number;
  navigationMode?: NavigationMode;
  globalTimeLimitSeconds?: number;
  randomizeQuestions?: boolean;
  createdByUserId?: number;
  isLiveSession?: boolean;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  navigationMode?: NavigationMode;
  globalTimeLimitSeconds?: number;
  randomizeQuestions?: boolean;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  navigationMode?: NavigationMode;
  globalTimeLimitSeconds?: number;
  randomizeQuestions?: boolean;
}

export interface Question {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
  correctKey: string;
  points: number;
  timeLimit: number;
  orderIndex: number;
  options: string[];
  caseSensitive?: boolean;
}

export interface CreateQuestionRequest {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
  correctKey: string;
  points: number;
  timeLimit: number;
  options: string[];
  caseSensitive?: boolean;
}

export interface UpdateQuestionRequest {
  text?: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
  correctKey?: string;
  points?: number;
  timeLimit?: number;
  options?: string[];
  caseSensitive?: boolean;
}

export interface Team {
  id: number;
  name: string;
  accessCode: string;
  quizId: number;
  totalScore: number;
}

export interface RegisterTeamRequest {
  name: string;
}

export interface ScoreboardEntry {
  teamId: number;
  teamName: string;
  score: number;
  rank: number;
}

export interface Submission {
  id: number;
  teamId: number;
  questionId: number;
  answerId: number;
  isCorrect: boolean;
  submittedAt: string;
}

export interface ParticipantQuestionResult {
  questionId: number;
  questionNumber: number;
  questionText: string;
  participantAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
}

export interface SubmitAnswerRequest {
  teamId: number;
  questionId: number;
  answerId: number;
}

export interface BackupRecord {
  id: number;
  filename: string;
  createdAt: string;
  fileSizeBytes: number;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  errorMessage: string | null;
  lastRestoredAt: string | null;
  createdByUsername: string | null;
}

export interface QuizAssignment {
  id: number;
  quizId: number;
  quizTitle: string;
  permissions: string[];
}

export interface CurrentUser {
  id: number;
  username: string;
  role: SystemRole;
  assignments: QuizAssignment[];
}

// Permission constants
export const PERMISSIONS = {
  CAN_VIEW_DETAILS: 'CAN_VIEW_DETAILS',
  CAN_EDIT_CONTENT: 'CAN_EDIT_CONTENT',
  CAN_MANAGE_TEAMS: 'CAN_MANAGE_TEAMS',
  CAN_HOST_GAME: 'CAN_HOST_GAME',
} as const;

// Access Resolution Types
export type RouteType = 'PARTICIPANT' | 'HOST' | 'INVALID';

export interface TeamResponse {
  id: number;
  name: string;
  accessCode: string;
  totalScore: number;
  quizId: number;
}

export interface QuizAccessResponse {
  id: number;
  title: string;
  quizCode?: string;
  proctorPin: string;
  isLive?: boolean;
  status: string;
  accessMode?: 'PUBLIC' | 'RESTRICTED';
}

export interface AccessResolutionResponse {
  routeType: RouteType;
  team?: TeamResponse;
  quiz?: QuizAccessResponse;
  errorMessage?: string;
}

export interface ParticipantAccessCheckResponse {
  allowed: boolean;
  message: string;
}

// Game State Types
export type GameState = 
  | 'LOBBY' 
  | 'BUFFER' 
  | 'ACTIVE' 
  | 'QUESTION' 
  | 'GRADING' 
  | 'REVEAL' 
  | 'ANSWER_REVEAL' 
  | 'ROUND_SUMMARY' 
  | 'SCOREBOARD' 
  | 'TIEBREAKER' 
  | 'ENDED' 
  | 'FINAL_RESULTS'
  | 'PAUSED';

export interface QuestionData {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  options: string[];
  timeLimit: number;
  points: number;
  correctAnswer?: string;
}

export interface GameStateMessage {
  state: GameState;
  quizId?: number;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  currentRound?: string;
  message?: string;
  // Embedded question payload from backend (QuestionPayload record)
  currentQuestion?: QuestionPayload | QuestionData;
  questionNumber?: number;
  timeRemaining?: number;
  rankings?: RankingEntry[];
}

/**
 * Backend QuestionPayload record shape.
 * Maps to com.intelliquiz.api.realtime.internal.presentation.dto.QuestionPayload
 */
export interface QuestionPayload {
  questionId: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  options: string[];
  timeLimit: number;
  points: number;
  orderIndex: number;
  round: string;
  // These are added by frontend mapping
  id?: number;
  correctAnswer?: string;
}

export interface RankingEntry {
  rank: number;
  teamId: number;
  teamName: string;
  score: number;
}

export interface TimerMessage {
  type: 'TIMER_UPDATE';
  timeRemaining: number;
  totalTime: number;
}

export interface TeamConnectionMessage {
  type: 'TEAM_CONNECTED' | 'TEAM_DISCONNECTED';
  teamId: number;
  teamName: string;
}

export interface SubmissionNotification {
  type: 'SUBMISSION_RECEIVED';
  teamId: number;
  teamName: string;
  timestamp: string;
}

export interface AnswerRevealData {
  type: 'ANSWER_REVEAL';
  correctAnswer: string;
  teamResults: Array<{
    teamId: number;
    teamName: string;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

// Realtime command types
export type CommandType = 
  | 'START_QUIZ'
  | 'START_ROUND' 
  | 'NEXT_QUESTION' 
  | 'VIEW_LEADERBOARD' 
  | 'START_TIEBREAKER' 
  | 'END_QUIZ' 
  | 'PAUSE' 
  | 'RESUME';

export interface CommandResponse {
  status: 'executed' | 'failed';
  newGameState: string | null;
  message: string;
}

export interface QuizRuntimeState {
  state: string;
  questionIndex: number;
  timeRemaining: number;
  timestamp: string;
}

export interface CommandMessage {
  type: CommandType;
  payload?: Record<string, unknown>;
}

export interface AnswerSubmissionMessage {
  type: 'SUBMIT_ANSWER';
  teamId: number;
  questionId: number;
  selectedOption: string;
  timestamp: string;
}

// ==================== Proctoring Types ====================

export type ViolationType = 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'RIGHT_CLICK' | 'PRINT_SCREEN';

export interface ViolationReportMessage {
  type: ViolationType;
}

export interface ViolationNotification {
  teamId: number;
  teamName: string;
  totalCount: number;
  lastType: ViolationType;
  autoKicked: boolean;
}

export interface ViolationLogRecord {
  id: number;
  quizId: number;
  teamId: number;
  teamName: string;
  violationType: string;
  detectedAt: string;
}

export interface KickMessage {
  teamId: number;
  teamName: string;
  reason: string;
}

export interface ThresholdMessage {
  threshold: number;
}

export interface NavigateMessage {
  questionIndex: number;
}

// ==================== Question Bank Types ====================

export interface QuestionBankItem {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
  correctKey: string;
  points: number;
  timeLimit: number;
  options: string[];
  category?: string;
  isHarvested?: boolean;
  sourceQuizId?: number;
  caseSensitive?: boolean;
}

// ==================== Question Bank API ====================

export const questionBankApi = {
  getAll: async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/question-bank`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<QuestionBankItem[]>(response);
  },

  getById: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/question-bank/${id}`, {
      headers: JSON_HEADERS,
    });
    return handleResponse<QuestionBankItem>(response);
  },

  delete: async (id: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/question-bank/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
    return handleResponse<void>(response);
  },

  harvestFromQuiz: async (quizId: number) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/harvest`, {
      method: 'POST',
      headers: JSON_HEADERS,
    });
    return handleResponse<QuestionBankItem[]>(response);
  },

  importToQuiz: async (quizId: number, bankItemIds: number[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions/import-from-bank`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(bankItemIds),
    });
    return handleResponse<Question[]>(response);
  },
};
