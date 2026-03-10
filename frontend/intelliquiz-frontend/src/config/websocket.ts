// WebSocket Configuration Constants

const WS_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const WS_CONFIG = {
  // Base WebSocket URL - must match backend endpoint /ws/quiz
  BASE_URL: `${WS_BASE}/ws/quiz`,
  
  // STOMP endpoints
  ENDPOINTS: {
    // Subscribe to game state updates
    GAME_STATE: (quizId: number) => `/topic/quiz/${quizId}/state`,
    
    // Subscribe to host-specific updates (submissions, etc.)
    HOST_UPDATES: (quizId: number) => `/topic/quiz/${quizId}/host`,
    
    // Subscribe to timer updates
    TIMER: (quizId: number) => `/topic/quiz/${quizId}/timer`,
    
    // Subscribe to team connection updates
    TEAMS: (quizId: number) => `/topic/quiz/${quizId}/teams`,
    
    // Subscribe to personal error messages
    ERRORS: '/user/queue/errors',
    
    // Send game commands (proctor only)
    SEND_COMMAND: (quizId: number) => `/app/quiz/${quizId}/command`,
    
    // Submit answers (participant only)
    SUBMIT_ANSWER: (quizId: number) => `/app/quiz/${quizId}/submit`,
    
    // Join quiz session
    JOIN: (quizId: number) => `/app/quiz/${quizId}/join`,
    
    // ==================== Proctoring Endpoints ====================
    
    // Subscribe to violation notifications (proctor)
    VIOLATIONS: (quizId: number) => `/topic/quiz/${quizId}/violations`,
    
    // Subscribe to kick events
    KICK: (quizId: number) => `/topic/quiz/${quizId}/kick`,
    
    // Subscribe to team-specific messages (participant)
    TEAM_QUEUE: (teamId: number) => `/queue/team/${teamId}`,
    
    // Send violation report (participant)
    SEND_VIOLATION: (quizId: number) => `/app/quiz/${quizId}/violation`,
    
    // Send manual kick (proctor/host)
    SEND_KICK: (quizId: number) => `/app/quiz/${quizId}/kick`,
    
    // Send auto-kick threshold (proctor/host)
    SEND_THRESHOLD: (quizId: number) => `/app/quiz/${quizId}/set-threshold`,
    
    // Send question navigation (participant, NON_LINEAR mode)
    SEND_NAVIGATE: (quizId: number) => `/app/quiz/${quizId}/navigate`,
    
    // Request current game status (on reconnect/initial connect)
    SEND_STATUS: (quizId: number) => `/app/quiz/${quizId}/status`,
  },
  
  // Reconnection settings
  RECONNECT: {
    DELAY: 5000,        // Initial delay before reconnecting (ms)
    MAX_DELAY: 30000,   // Maximum delay between reconnection attempts (ms)
    MAX_ATTEMPTS: 10,   // Maximum number of reconnection attempts
  },
  
  // Heartbeat settings
  HEARTBEAT: {
    INCOMING: 10000,    // Expected heartbeat from server (ms)
    OUTGOING: 10000,    // Heartbeat to send to server (ms)
  },
} as const;

export type WebSocketEndpoints = typeof WS_CONFIG.ENDPOINTS;
