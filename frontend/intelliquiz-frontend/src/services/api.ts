// IntelliQuiz API Service
const API_BASE_URL = 'http://localhost:8090';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

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
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ token: string; role: string; username: string }>(response);
  },
};

// Access Code Resolution API (Public - no auth required)
export const accessApi = {
  resolveCode: async (code: string): Promise<AccessResolutionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/access/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return handleResponse<AccessResolutionResponse>(response);
  },
};

// Current User API (for fetching own info and assignments)
export const currentUserApi = {
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },

  getMyAssignments: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/assignments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<QuizAssignment[]>(response);
  },
};

// Users API (SUPER_ADMIN only)
export const usersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(response);
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },

  getUserAssignments: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/assignments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<QuizAssignment[]>(response);
  },

  create: async (data: CreateUserRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  update: async (id: number, data: UpdateUserRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  assignPermissions: async (userId: number, data: AssignPermissionsRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/permissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<void>(response);
  },

  revokePermissions: async (userId: number, quizId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/permissions/${quizId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },
};

// Quizzes API
export const quizzesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz[]>(response);
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },

  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/active`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },

  create: async (data: CreateQuizRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Quiz>(response);
  },

  update: async (id: number, data: UpdateQuizRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Quiz>(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  markReady: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}/ready`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },

  activate: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },

  deactivate: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },

  archive: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}/archive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Quiz>(response);
  },
};

// Questions API
export const questionsApi = {
  getByQuiz: async (quizId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Question[]>(response);
  },

  create: async (quizId: number, data: CreateQuestionRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  update: async (id: number, data: UpdateQuestionRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  reorder: async (quizId: number, questionIds: number[]) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions/reorder`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questionIds }),
    });
    return handleResponse<void>(response);
  },
};

// Teams API
export const teamsApi = {
  getByQuiz: async (quizId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Team[]>(response);
  },

  register: async (quizId: number, data: RegisterTeamRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Team>(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  resetScores: async (quizId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/teams/reset-scores`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },
};

// Scoreboard API
export const scoreboardApi = {
  getByQuiz: async (quizId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/scoreboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ScoreboardEntry[]>(response);
  },
};

// Backups API (SUPER_ADMIN only)
export const backupsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/backups`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackupRecord[]>(response);
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/backups/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackupRecord>(response);
  },

  create: async () => {
    const response = await fetch(`${API_BASE_URL}/api/backups`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<BackupRecord>(response);
  },

  restore: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/backups/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<BackupRecord>(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/backups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  download: (id: number) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/backups/${id}/download?token=${token}`;
  },
};

// Submissions API
export const submissionsApi = {
  getByTeam: async (teamId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/submissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Submission[]>(response);
  },

  submit: async (data: SubmitAnswerRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(response);
  },
};

// Types
export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
}

export interface AssignPermissionsRequest {
  quizId: number;
  permissions: string[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  proctorPin: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
  questionCount?: number;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
}

export interface Question {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctKey: string;
  points: number;
  timeLimit: number;
  orderIndex: number;
  options: string[];
}

export interface CreateQuestionRequest {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctKey: string;
  points: number;
  timeLimit: number;
  options: string[];
}

export interface UpdateQuestionRequest {
  text?: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  correctKey?: string;
  points?: number;
  timeLimit?: number;
  options?: string[];
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
  role: 'ADMIN' | 'SUPER_ADMIN';
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
  proctorPin: string;
  status: string;
}

export interface AccessResolutionResponse {
  routeType: RouteType;
  team?: TeamResponse;
  quiz?: QuizAccessResponse;
  errorMessage?: string;
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
  | 'FINAL_RESULTS';

export interface QuestionData {
  id: number;
  text: string;
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
  currentQuestion?: QuestionData;
  questionNumber?: number;
  timeRemaining?: number;
  rankings?: RankingEntry[];
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

// WebSocket Command Types
export type CommandType = 
  | 'START_ROUND' 
  | 'NEXT_QUESTION' 
  | 'VIEW_LEADERBOARD' 
  | 'START_TIEBREAKER' 
  | 'END_QUIZ' 
  | 'PAUSE' 
  | 'RESUME';

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
