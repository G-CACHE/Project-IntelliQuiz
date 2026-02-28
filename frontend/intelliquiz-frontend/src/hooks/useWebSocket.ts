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
}

export interface UseWebSocketReturn extends WebSocketState {
  sendCommand: (command: CommandMessage) => void;
  submitAnswer: (submission: Omit<AnswerSubmissionMessage, 'type' | 'timestamp'>) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (
  quizId: number,
  role: WebSocketRole,
  teamId?: number,
  teamName?: string,
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
  });

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const reconnectAttemptsRef = useRef(0);


  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleGameStateMessage = useCallback((message: IMessage) => {
    try {
      const data = JSON.parse(message.body) as GameStateMessage;
      console.log('[WebSocket] Game state message received:', data);
      updateState({
        gameState: data.state,
        currentQuestion: data.currentQuestion || null,
        questionNumber: data.currentQuestionIndex !== undefined ? data.currentQuestionIndex + 1 : (data.questionNumber || 0),
        totalQuestions: data.totalQuestions || 0,
        timeRemaining: data.timeRemaining || 0,
        rankings: data.rankings || [],
      });
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
        }
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
  }, [quizId, role, accessCode, updateState, handleGameStateMessage, handleTimerMessage, handleTeamConnectionMessage, handleSubmissionMessage, handleErrorMessage]);


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

    const fullSubmission: AnswerSubmissionMessage = {
      ...submission,
      type: 'SUBMIT_ANSWER',
      timestamp: new Date().toISOString(),
    };

    clientRef.current.publish({
      destination: WS_CONFIG.ENDPOINTS.SUBMIT_ANSWER(quizId),
      body: JSON.stringify(fullSubmission),
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
  };
};

export default useWebSocket;
