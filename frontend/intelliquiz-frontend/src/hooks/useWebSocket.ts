import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_CONFIG } from '../config/websocket';
import type {
  GameStateMessage,
  TimerMessage,
  TeamConnectionMessage,
  SubmissionNotification,
  CommandMessage,
  AnswerSubmissionMessage,
  RankingEntry,
  GameState,
  ViolationNotification,
  KickMessage,
  ViolationType,
} from '../services/api';

export type WebSocketRole = 'PROCTOR' | 'PARTICIPANT';

export interface ConnectedTeam {
  id: number;
  name: string;
  connectedAt: string;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  gameState: GameState | null;
  currentQuestion: GameStateMessage['currentQuestion'] | null;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  connectedTeams: ConnectedTeam[];
  submissions: SubmissionNotification[];
  rankings: RankingEntry[];
  // Proctoring state
  violations: ViolationNotification[];
  kicked: boolean;
  kickReason: string | null;
}

export interface UseWebSocketReturn extends WebSocketState {
  sendCommand: (command: CommandMessage) => void;
  submitAnswer: (submission: Omit<AnswerSubmissionMessage, 'type' | 'timestamp'>) => void;
  reconnect: () => void;
  disconnect: () => void;
  // Proctoring methods
  reportViolation: (type: ViolationType) => void;
  kickTeam: (teamId: number, teamName: string) => void;
  setAutoKickThreshold: (threshold: number) => void;
  navigateToQuestion: (questionIndex: number) => void;
}

export const useWebSocket = (
  quizId: number,
  role: WebSocketRole,
  teamId?: number,
  _teamName?: string,
  accessCode?: string
): UseWebSocketReturn => {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    gameState: null,
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    timeRemaining: 0,
    connectedTeams: [],
    submissions: [],
    rankings: [],
    violations: [],
    kicked: false,
    kickReason: null,
  });

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const reconnectAttemptsRef = useRef(0);


  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleGameStateMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body);
      console.log('[WebSocket] Game state message received:', data);
      
      // Detect message type by checking for discriminating fields
      if (data.state !== undefined) {
        // This is a GameStateMessage (possibly with embedded currentQuestion)
        const gsm = data as GameStateMessage;
        
        // Build currentQuestion from embedded payload if present
        let question: GameStateMessage['currentQuestion'] | null = null;
        if (gsm.currentQuestion) {
          question = {
            id: gsm.currentQuestion.questionId ?? gsm.currentQuestion.id,
            text: gsm.currentQuestion.text,
            options: gsm.currentQuestion.options || [],
            timeLimit: gsm.currentQuestion.timeLimit || 30,
            points: gsm.currentQuestion.points || 0,
            correctAnswer: gsm.currentQuestion.correctAnswer,
          };
        }
        
        // Map backend states to frontend states
        let mappedState: GameState = gsm.state;
        if (gsm.state === 'ACTIVE') mappedState = 'QUESTION';
        if (gsm.state === 'ENDED') mappedState = 'FINAL_RESULTS';
        
        // Build partial update — only include fields that have actual values
        // This preserves currentQuestion/totalQuestions across REVEAL, GRADING, PAUSED, etc.
        setState(prev => {
          const updates: Partial<WebSocketState> = {
            gameState: mappedState,
          };
          
          // Only update currentQuestion if one was provided
          if (question) {
            updates.currentQuestion = question;
          }
          
          // Only update questionNumber if provided
          if (gsm.currentQuestionIndex !== undefined && gsm.currentQuestionIndex !== null) {
            updates.questionNumber = gsm.currentQuestionIndex + 1;
          }
          
          // Only update totalQuestions if provided and > 0 (preserve previous value otherwise)
          if (gsm.totalQuestions && gsm.totalQuestions > 0) {
            updates.totalQuestions = gsm.totalQuestions;
          }
          
          if (gsm.timeRemaining) {
            updates.timeRemaining = gsm.timeRemaining;
          }
          
          if (gsm.rankings && gsm.rankings.length > 0) {
            updates.rankings = gsm.rankings;
          }
          
          return { ...prev, ...updates };
        });
      } else if (data.questionId !== undefined && data.text !== undefined && data.correctAnswer === undefined) {
        // This is a standalone QuestionPayload (e.g., from navigate or legacy broadcast)
        const question = {
          id: data.questionId,
          text: data.text,
          options: data.options || [],
          timeLimit: data.timeLimit || 30,
          points: data.points || 0,
        };
        updateState({
          gameState: 'QUESTION',
          currentQuestion: question,
        });
      } else if (data.correctAnswer !== undefined && data.teamResults !== undefined) {
        // This is an AnswerRevealPayload — preserve currentQuestion and add correctAnswer
        const rankings = (data.teamResults || []).map((tr: { teamId: number; teamName: string; totalScore: number; rank: number }) => ({
          teamId: tr.teamId,
          teamName: tr.teamName,
          score: tr.totalScore,
          rank: tr.rank,
        }));
        
        setState(prev => ({
          ...prev,
          gameState: 'ANSWER_REVEAL' as GameState,
          rankings,
          currentQuestion: prev.currentQuestion
            ? { ...prev.currentQuestion, correctAnswer: data.correctAnswer }
            : prev.currentQuestion,
        }));
      } else if (Array.isArray(data)) {
        // This is a scoreboard (List<TeamResult>)
        const rankings = data.map((tr: { teamId: number; teamName: string; totalScore: number; rank: number }, idx: number) => ({
          teamId: tr.teamId,
          teamName: tr.teamName,
          score: tr.totalScore,
          rank: tr.rank || idx + 1,
        }));
        updateState({
          gameState: 'SCOREBOARD',
          rankings,
        });
      } else {
        console.warn('[WebSocket] Unknown message type on state topic:', data);
      }
    } catch (err) {
      console.error('[WebSocket] Failed to parse game state message:', err);
    }
  }, [updateState]);

  const handleTimerMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as TimerMessage;
      updateState({ timeRemaining: data.timeRemaining });
    } catch (err) {
      console.error('[WebSocket] Failed to parse timer message:', err);
    }
  }, [updateState]);

  const handleTeamConnectionMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as TeamConnectionMessage;
      setState(prev => {
        if (data.type === 'TEAM_CONNECTED') {
          const exists = prev.connectedTeams.some(t => t.id === data.teamId);
          if (exists) return prev;
          return {
            ...prev,
            connectedTeams: [
              ...prev.connectedTeams,
              { id: data.teamId, name: data.teamName, connectedAt: new Date().toISOString() },
            ],
          };
        } else if (data.type === 'TEAM_DISCONNECTED') {
          return {
            ...prev,
            connectedTeams: prev.connectedTeams.filter(t => t.id !== data.teamId),
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('[WebSocket] Failed to parse team connection message:', err);
    }
  }, []);

  const handleSubmissionMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as SubmissionNotification;
      setState(prev => ({
        ...prev,
        submissions: [...prev.submissions, data],
      }));
    } catch (err) {
      console.error('[WebSocket] Failed to parse submission message:', err);
    }
  }, []);

  const handleErrorMessage = useCallback((message: IMessage) => {
    updateState({ error: message.body });
  }, [updateState]);

  const handleViolationMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as ViolationNotification;
      console.log('[WebSocket] Violation notification received:', data);
      setState(prev => ({
        ...prev,
        violations: [...prev.violations, data],
      }));
    } catch (err) {
      console.error('[WebSocket] Failed to parse violation message:', err);
    }
  }, []);

  const handleKickMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as KickMessage;
      console.log('[WebSocket] Kick message received:', data);
      // If this message targets our team, mark as kicked
      if (teamId && data.teamId === teamId) {
        updateState({ kicked: true, kickReason: data.reason });
      }
    } catch (err) {
      console.error('[WebSocket] Failed to parse kick message:', err);
    }
  }, [teamId, updateState]);


  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    console.log('[WebSocket] Connecting with accessCode:', accessCode);
    updateState({ connecting: true, error: null });

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_CONFIG.BASE_URL),
      connectHeaders: {
        accessCode: accessCode || '',
      },
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      reconnectDelay: WS_CONFIG.RECONNECT.DELAY,
      heartbeatIncoming: WS_CONFIG.HEARTBEAT.INCOMING,
      heartbeatOutgoing: WS_CONFIG.HEARTBEAT.OUTGOING,

      onConnect: () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;
        updateState({ connected: true, connecting: false, error: null });

        // Subscribe to game state updates
        const gameStateSub = client.subscribe(
          WS_CONFIG.ENDPOINTS.GAME_STATE(quizId),
          handleGameStateMessage
        );
        subscriptionsRef.current.push(gameStateSub);

        // Subscribe to timer updates
        const timerSub = client.subscribe(
          WS_CONFIG.ENDPOINTS.TIMER(quizId),
          handleTimerMessage
        );
        subscriptionsRef.current.push(timerSub);

        // Subscribe to team connection updates
        const teamsSub = client.subscribe(
          WS_CONFIG.ENDPOINTS.TEAMS(quizId),
          handleTeamConnectionMessage
        );
        subscriptionsRef.current.push(teamsSub);

        // Subscribe to error messages
        const errorSub = client.subscribe(
          WS_CONFIG.ENDPOINTS.ERRORS,
          handleErrorMessage
        );
        subscriptionsRef.current.push(errorSub);

        // Proctor-specific subscriptions
        if (role === 'PROCTOR') {
          const hostSub = client.subscribe(
            WS_CONFIG.ENDPOINTS.HOST_UPDATES(quizId),
            handleSubmissionMessage
          );
          subscriptionsRef.current.push(hostSub);

          // Subscribe to violation notifications (proctor only)
          const violationSub = client.subscribe(
            WS_CONFIG.ENDPOINTS.VIOLATIONS(quizId),
            handleViolationMessage
          );
          subscriptionsRef.current.push(violationSub);
        }

        // Subscribe to kick events (all roles)
        const kickSub = client.subscribe(
          WS_CONFIG.ENDPOINTS.KICK(quizId),
          handleKickMessage
        );
        subscriptionsRef.current.push(kickSub);

        // Participant-specific: team queue for targeted messages
        if (role === 'PARTICIPANT' && teamId) {
          const teamQueueSub = client.subscribe(
            WS_CONFIG.ENDPOINTS.TEAM_QUEUE(teamId),
            handleKickMessage
          );
          subscriptionsRef.current.push(teamQueueSub);
        }

        // Request current game state snapshot (handles reconnection and late joins)
        setTimeout(() => {
          if (client.connected) {
            client.publish({
              destination: WS_CONFIG.ENDPOINTS.SEND_STATUS(quizId),
              body: JSON.stringify({}),
            });
            console.log('[WebSocket] Sent status request for quiz', quizId);
          }
        }, 200);
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
        updateState({ connected: false, connecting: false });
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message']);
        updateState({
          connected: false,
          connecting: false,
          error: frame.headers['message'] || 'Connection error',
        });
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket error:', event);
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current >= WS_CONFIG.RECONNECT.MAX_ATTEMPTS) {
          updateState({
            connected: false,
            connecting: false,
            error: 'Failed to connect after multiple attempts',
          });
        }
      },
    });

    clientRef.current = client;
    client.activate();
  }, [quizId, role, accessCode, teamId, updateState, handleGameStateMessage, handleTimerMessage, handleTeamConnectionMessage, handleSubmissionMessage, handleErrorMessage, handleViolationMessage, handleKickMessage]);


  const disconnect = useCallback(() => {
    // Unsubscribe from all subscriptions
    subscriptionsRef.current.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (err) {
        console.error('[WebSocket] Error unsubscribing:', err);
      }
    });
    subscriptionsRef.current = [];

    // Deactivate client
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    updateState({
      connected: false,
      connecting: false,
      error: null,
    });
  }, [updateState]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  const sendCommand = useCallback((command: CommandMessage) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot send command: not connected');
      return;
    }

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SEND_COMMAND(quizId),
      body: JSON.stringify(command),
    });
  }, [quizId]);

  const submitAnswer = useCallback((submission: Omit<AnswerSubmissionMessage, 'type' | 'timestamp'>) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot submit answer: not connected');
      return;
    }

    // Map frontend field names to backend SubmissionMessage record (questionId, answer)
    const backendPayload = {
      questionId: submission.questionId,
      answer: submission.selectedOption,
    };

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SUBMIT_ANSWER(quizId),
      body: JSON.stringify(backendPayload),
    });
  }, [quizId]);

  const reportViolation = useCallback((type: ViolationType) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot report violation: not connected');
      return;
    }

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SEND_VIOLATION(quizId),
      body: JSON.stringify({ type }),
    });
  }, [quizId]);

  const kickTeam = useCallback((kickTeamId: number, kickTeamName: string) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot kick team: not connected');
      return;
    }

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SEND_KICK(quizId),
      body: JSON.stringify({ teamId: kickTeamId, teamName: kickTeamName, reason: 'Manual kick by proctor' }),
    });
  }, [quizId]);

  const setAutoKickThreshold = useCallback((threshold: number) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot set threshold: not connected');
      return;
    }

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SEND_THRESHOLD(quizId),
      body: JSON.stringify({ threshold }),
    });
  }, [quizId]);

  const navigateToQuestion = useCallback((questionIndex: number) => {
    if (!clientRef.current?.connected) {
      console.error('[WebSocket] Cannot navigate: not connected');
      return;
    }

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SEND_NAVIGATE(quizId),
      body: JSON.stringify({ questionIndex }),
    });
  }, [quizId]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Clear submissions when question changes
  useEffect(() => {
    setState(prev => ({ ...prev, submissions: [] }));
  }, [state.questionNumber]);

  return {
    ...state,
    sendCommand,
    submitAnswer,
    reconnect,
    disconnect,
    reportViolation,
    kickTeam,
    setAutoKickThreshold,
    navigateToQuestion,
  };
};

export default useWebSocket;
