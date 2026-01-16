# Design Document

## Overview

This design document specifies the implementation of the proctor (host) and participant (team/player) user interfaces for the IntelliQuiz quiz system. The solution provides separate authentication flows using access codes, real-time game synchronization via WebSocket, and comprehensive UI/UX for both roles throughout the quiz lifecycle (lobby → game → scoreboard).

The design integrates with existing backend APIs (`/api/access/resolve`, `/api/auth/login`) and WebSocket infrastructure (`/ws/quiz/{quizId}`) to deliver a seamless, real-time quiz experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Proctor Login│  │Participant   │  │  Admin Login │     │
│  │    Page      │  │ Login Page   │  │    (Exists)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                 │
│         └──────────┬───────┘                                │
│                    │                                         │
│         ┌──────────▼──────────┐                            │
│         │ Access Resolution   │                            │
│         │     Service         │                            │
│         └──────────┬──────────┘                            │
│                    │                                         │
│         ┌──────────▼──────────┐                            │
│         │  WebSocket Manager  │                            │
│         └──────────┬──────────┘                            │
│                    │                                         │
│    ┌───────────────┴───────────────┐                       │
│    │                                │                       │
│ ┌──▼────────┐              ┌───────▼──────┐               │
│ │  Proctor  │              │ Participant  │               │
│ │   Flow    │              │    Flow      │               │
│ ├───────────┤              ├──────────────┤               │
│ │ • Lobby   │              │ • Lobby      │               │
│ │ • Game    │              │ • Game       │               │
│ │ • Score   │              │ • Score      │               │
│ └───────────┘              └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    Backend Services                           │
├──────────────────────────────────────────────────────────────┤
│  /api/access/resolve  │  /ws/quiz/{quizId}  │  /api/auth/*  │
└──────────────────────────────────────────────────────────────┘
```

### Component Architecture


**Frontend Components:**

1. **Access Code Login Components**
   - `ProctorLogin.tsx` - Proctor PIN entry page
   - `ParticipantLogin.tsx` - Team code entry page
   - `AccessCodeInput.tsx` - Reusable input component with validation

2. **Proctor Components**
   - `ProctorLobby.tsx` - Team monitoring and game start
   - `ProctorGame.tsx` - Game control interface
   - `ProctorScoreboard.tsx` - Results display with controls

3. **Participant Components**
   - `ParticipantLobby.tsx` - Waiting room
   - `ParticipantGame.tsx` - Question display and answer submission
   - `ParticipantScoreboard.tsx` - Results viewing

4. **Shared Components**
   - `TeamGrid.tsx` - Display connected teams
   - `QuestionDisplay.tsx` - Question rendering
   - `Timer.tsx` - Countdown timer
   - `ScoreboardTable.tsx` - Rankings display
   - `ErrorBoundary.tsx` - Error handling wrapper

5. **Services & Hooks**
   - `useWebSocket.ts` - WebSocket connection management
   - `useGameState.ts` - Game state synchronization
   - `accessApi.ts` - Access code resolution API
   - `gameApi.ts` - Game-related API calls

## Components and Interfaces

### 1. Access Code Resolution Service

**Purpose:** Validate access codes and route users to appropriate interfaces.

**API Integration:**
```typescript
// POST /api/access/resolve
interface AccessCodeRequest {
  code: string;
}

interface AccessResolutionResponse {
  routeType: 'PARTICIPANT' | 'HOST' | 'INVALID';
  team?: TeamResponse;
  quiz?: QuizResponse;
  errorMessage?: string;
}

interface TeamResponse {
  id: number;
  name: string;
  accessCode: string;
  quizId: number;
}

interface QuizResponse {
  id: number;
  title: string;
  proctorPin: string;
  status: string;
}
```

**Implementation:**
```typescript
// services/accessApi.ts
export const accessApi = {
  resolveCode: async (code: string): Promise<AccessResolutionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/access/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to resolve access code');
    }
    
    return response.json();
  },
};
```



### 2. WebSocket Connection Manager

**Purpose:** Establish and maintain real-time bidirectional communication with the backend.

**WebSocket Endpoints:**
- Connection: `ws://localhost:8090/ws/quiz/{quizId}`
- Subscribe to game state: `/topic/quiz/{quizId}/state`
- Subscribe to host updates: `/topic/quiz/{quizId}/host`
- Subscribe to timer: `/topic/quiz/{quizId}/timer`
- Subscribe to errors: `/user/queue/errors`
- Send commands: `/app/quiz/{quizId}/command`
- Submit answers: `/app/quiz/{quizId}/submit`

**Message Types:**
```typescript
// Game State Messages
interface GameStateMessage {
  type: 'GAME_STATE';
  state: 'LOBBY' | 'QUESTION' | 'BUFFER' | 'ANSWER_REVEAL' | 'SCOREBOARD' | 'FINAL_RESULTS';
  currentQuestion?: QuestionData;
  questionNumber?: number;
  totalQuestions?: number;
  timeRemaining?: number;
}

interface QuestionData {
  id: number;
  text: string;
  options: string[];
  timeLimit: number;
  points: number;
}

// Timer Messages
interface TimerMessage {
  type: 'TIMER_UPDATE';
  timeRemaining: number;
  totalTime: number;
}

// Team Connection Messages
interface TeamConnectionMessage {
  type: 'TEAM_CONNECTED' | 'TEAM_DISCONNECTED';
  teamId: number;
  teamName: string;
}

// Submission Messages
interface SubmissionMessage {
  type: 'SUBMISSION_RECEIVED';
  teamId: number;
  teamName: string;
  timestamp: string;
}

// Answer Reveal Messages
interface AnswerRevealMessage {
  type: 'ANSWER_REVEAL';
  correctAnswer: string;
  teamResults: Array<{
    teamId: number;
    teamName: string;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

// Scoreboard Messages
interface ScoreboardMessage {
  type: 'SCOREBOARD_UPDATE';
  rankings: Array<{
    rank: number;
    teamId: number;
    teamName: string;
    score: number;
  }>;
}

// Command Messages (sent by proctor)
interface CommandMessage {
  type: 'START_QUIZ' | 'SHOW_BUFFER' | 'REVEAL_ANSWER' | 'SHOW_SCOREBOARD' | 'NEXT_QUESTION' | 'END_QUIZ';
}

// Answer Submission (sent by participants)
interface AnswerSubmissionMessage {
  type: 'SUBMIT_ANSWER';
  teamId: number;
  questionId: number;
  selectedOption: string;
  timestamp: string;
}
```

**Hook Implementation:**
```typescript
// hooks/useWebSocket.ts
export const useWebSocket = (quizId: number, role: 'PROCTOR' | 'PARTICIPANT') => {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStateMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL}/ws/quiz/${quizId}`);
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      setConnected(true);
      
      // Subscribe to game state updates
      stompClient.subscribe(`/topic/quiz/${quizId}/state`, (message) => {
        const data = JSON.parse(message.body);
        setGameState(data);
      });

      // Subscribe to role-specific channels
      if (role === 'PROCTOR') {
        stompClient.subscribe(`/topic/quiz/${quizId}/host`, (message) => {
          // Handle host-specific messages
        });
      }

      // Subscribe to timer updates
      stompClient.subscribe(`/topic/quiz/${quizId}/timer`, (message) => {
        // Handle timer updates
      });

      // Subscribe to errors
      stompClient.subscribe('/user/queue/errors', (message) => {
        setError(message.body);
      });
    }, (error) => {
      setError('WebSocket connection failed');
      setConnected(false);
    });

    stompClientRef.current = stompClient;

    return () => {
      if (stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [quizId, role]);

  const sendCommand = (command: CommandMessage) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.send(
        `/app/quiz/${quizId}/command`,
        {},
        JSON.stringify(command)
      );
    }
  };

  const submitAnswer = (submission: AnswerSubmissionMessage) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.send(
        `/app/quiz/${quizId}/submit`,
        {},
        JSON.stringify(submission)
      );
    }
  };

  return { connected, gameState, error, sendCommand, submitAnswer };
};
```



### 3. Login Page Components

**ProctorLogin Component:**
```typescript
// pages/proctor/ProctorLogin.tsx
interface ProctorLoginProps {}

const ProctorLogin: React.FC<ProctorLoginProps> = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await accessApi.resolveCode(pin);
      
      if (result.routeType === 'HOST' && result.quiz) {
        // Store quiz info in session
        sessionStorage.setItem('quizId', result.quiz.id.toString());
        sessionStorage.setItem('quizTitle', result.quiz.title);
        sessionStorage.setItem('role', 'PROCTOR');
        
        // Navigate to proctor lobby
        navigate(`/host/lobby?quizId=${result.quiz.id}`);
      } else {
        setError('Invalid proctor PIN');
      }
    } catch (err) {
      setError('Failed to validate PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-primary-dark rounded-lg shadow-glow">
        <h1 className="text-4xl font-black text-accent mb-2 text-center">
          Proctor Login
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Enter your proctor PIN to host the quiz
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">
              Proctor PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-black border-2 border-accent-30 rounded-lg text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-accent"
              placeholder="XXXX-XXXX"
              maxLength={9}
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error rounded-lg text-white text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3 bg-accent text-black font-bold rounded-lg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Validating...' : 'Enter Lobby'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-accent hover:text-accent-light text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};
```

**ParticipantLogin Component:**
```typescript
// pages/participant/ParticipantLogin.tsx
const ParticipantLogin: React.FC = () => {
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await accessApi.resolveCode(teamCode);
      
      if (result.routeType === 'PARTICIPANT' && result.team) {
        // Store team info in session
        sessionStorage.setItem('teamId', result.team.id.toString());
        sessionStorage.setItem('teamName', result.team.name);
        sessionStorage.setItem('quizId', result.team.quizId.toString());
        sessionStorage.setItem('role', 'PARTICIPANT');
        
        // Navigate to participant lobby
        navigate(`/player/lobby?quizId=${result.team.quizId}&teamId=${result.team.id}`);
      } else {
        setError('Invalid team code');
      }
    } catch (err) {
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-primary-dark rounded-lg shadow-glow">
        <h1 className="text-4xl font-black text-accent mb-2 text-center">
          Join Quiz
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Enter your team code to join the quiz
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">
              Team Code
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-black border-2 border-accent-30 rounded-lg text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-accent"
              placeholder="XXXX-XXXX"
              maxLength={9}
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error rounded-lg text-white text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || teamCode.length < 4}
            className="w-full py-3 bg-accent text-black font-bold rounded-lg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Lobby'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-accent hover:text-accent-light text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};
```



### 4. Proctor Lobby Component

```typescript
// pages/host/HostLobby.tsx
interface ConnectedTeam {
  id: number;
  name: string;
  connectedAt: string;
}

const HostLobby: React.FC = () => {
  const [quizId] = useState(() => parseInt(sessionStorage.getItem('quizId') || '0'));
  const [quizTitle] = useState(() => sessionStorage.getItem('quizTitle') || 'Quiz');
  const [connectedTeams, setConnectedTeams] = useState<ConnectedTeam[]>([]);
  const [proctorPin, setProctorPin] = useState('');
  const navigate = useNavigate();

  const { connected, gameState, error, sendCommand } = useWebSocket(quizId, 'PROCTOR');

  // Handle team connection events
  useEffect(() => {
    // WebSocket will update connectedTeams via subscription
  }, [gameState]);

  const handleStartQuiz = () => {
    if (connectedTeams.length === 0) {
      alert('No teams connected. Wait for teams to join.');
      return;
    }
    sendCommand({ type: 'START_QUIZ' });
  };

  // Navigate to game when quiz starts
  useEffect(() => {
    if (gameState?.state === 'QUESTION') {
      navigate(`/host/game?quizId=${quizId}`);
    }
  }, [gameState?.state, quizId, navigate]);

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-accent">{quizTitle}</h1>
            <p className="text-gray-400 mt-1">Proctor Lobby</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Proctor PIN</p>
            <p className="text-2xl font-bold text-white tracking-widest">{proctorPin}</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-6 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-success' : 'bg-error'}`} />
          <span className="text-gray-300">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-light border border-error rounded-lg text-white">
            {error}
          </div>
        )}

        {/* Teams Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Connected Teams ({connectedTeams.length})
          </h2>
          
          {connectedTeams.length === 0 ? (
            <div className="text-center py-12 bg-primary-dark rounded-lg border border-accent-30">
              <p className="text-gray-400 text-lg">Waiting for teams to join...</p>
              <p className="text-gray-500 text-sm mt-2">
                Share the team codes with participants
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {connectedTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 bg-primary-dark rounded-lg border border-accent-30 animate-fade-in"
                >
                  <p className="text-white font-bold text-lg">{team.name}</p>
                  <p className="text-gray-400 text-sm">Connected</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStartQuiz}
            disabled={!connected || connectedTeams.length === 0}
            className="px-12 py-4 bg-accent text-black font-black text-xl rounded-lg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-glow"
          >
            Start Quiz
          </button>
          <p className="text-gray-500 text-sm mt-2">
            {connectedTeams.length === 0
              ? 'Waiting for teams to connect'
              : `${connectedTeams.length} team(s) ready`}
          </p>
        </div>
      </div>
    </div>
  );
};
```

### 5. Participant Lobby Component

```typescript
// pages/player/PlayerLobby.tsx
const PlayerLobby: React.FC = () => {
  const [quizId] = useState(() => parseInt(sessionStorage.getItem('quizId') || '0'));
  const [teamName] = useState(() => sessionStorage.getItem('teamName') || 'Team');
  const [teamCount, setTeamCount] = useState(0);
  const navigate = useNavigate();

  const { connected, gameState, error } = useWebSocket(quizId, 'PARTICIPANT');

  // Navigate to game when quiz starts
  useEffect(() => {
    if (gameState?.state === 'QUESTION') {
      navigate(`/player/game?quizId=${quizId}`);
    }
  }, [gameState?.state, quizId, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8">
        {/* Team Name */}
        <div className="mb-8">
          <p className="text-gray-400 text-sm mb-2">Your Team</p>
          <h1 className="text-5xl font-black text-accent">{teamName}</h1>
        </div>

        {/* Connection Status */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-error'}`} />
          <span className="text-gray-300">
            {connected ? 'Connected to quiz' : 'Connecting...'}
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-light border border-error rounded-lg text-white">
            {error}
          </div>
        )}

        {/* Waiting Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-xl mt-6">Waiting for host to start...</p>
          <p className="text-gray-500 text-sm mt-2">
            Get ready! The quiz will begin soon.
          </p>
        </div>

        {/* Team Count */}
        {teamCount > 0 && (
          <p className="text-gray-400">
            {teamCount} team{teamCount !== 1 ? 's' : ''} connected
          </p>
        )}
      </div>
    </div>
  );
};
```



### 6. Proctor Game Control Component

```typescript
// pages/host/HostGame.tsx
const HostGame: React.FC = () => {
  const [quizId] = useState(() => parseInt(sessionStorage.getItem('quizId') || '0'));
  const [submissions, setSubmissions] = useState<SubmissionMessage[]>([]);
  const navigate = useNavigate();

  const { connected, gameState, error, sendCommand } = useWebSocket(quizId, 'PROCTOR');

  const handleShowBuffer = () => sendCommand({ type: 'SHOW_BUFFER' });
  const handleRevealAnswer = () => sendCommand({ type: 'REVEAL_ANSWER' });
  const handleShowScoreboard = () => sendCommand({ type: 'SHOW_SCOREBOARD' });
  const handleNextQuestion = () => sendCommand({ type: 'NEXT_QUESTION' });
  const handleEndQuiz = () => sendCommand({ type: 'END_QUIZ' });

  // Navigate based on game state
  useEffect(() => {
    if (gameState?.state === 'FINAL_RESULTS') {
      navigate(`/host/scoreboard?quizId=${quizId}&final=true`);
    }
  }, [gameState?.state, quizId, navigate]);

  const renderControls = () => {
    switch (gameState?.state) {
      case 'QUESTION':
        return (
          <button onClick={handleShowBuffer} className="btn-primary">
            End Question / Show Buffer
          </button>
        );
      case 'BUFFER':
        return (
          <button onClick={handleRevealAnswer} className="btn-primary">
            Reveal Answer
          </button>
        );
      case 'ANSWER_REVEAL':
        return (
          <button onClick={handleShowScoreboard} className="btn-primary">
            Show Scoreboard
          </button>
        );
      case 'SCOREBOARD':
        return (
          <div className="flex gap-4">
            {gameState.questionNumber < gameState.totalQuestions ? (
              <button onClick={handleNextQuestion} className="btn-primary">
                Next Question
              </button>
            ) : (
              <button onClick={handleEndQuiz} className="btn-accent">
                End Quiz
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-400 text-sm">
              Question {gameState?.questionNumber} of {gameState?.totalQuestions}
            </p>
            <h1 className="text-2xl font-bold text-white">Proctor View</h1>
          </div>
          <div className="text-right">
            <Timer timeRemaining={gameState?.timeRemaining || 0} />
          </div>
        </div>

        {/* Question Display */}
        {gameState?.currentQuestion && (
          <div className="mb-8 p-6 bg-primary-dark rounded-lg border border-accent-30">
            <h2 className="text-2xl font-bold text-white mb-6">
              {gameState.currentQuestion.text}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {gameState.currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className="p-4 bg-black rounded-lg border border-gray-700 text-white"
                >
                  <span className="font-bold text-accent mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Stats (Buffer State) */}
        {gameState?.state === 'BUFFER' && (
          <div className="mb-8 p-6 bg-primary-dark rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Submissions</h3>
            <p className="text-3xl font-black text-accent">
              {submissions.length} / {/* total teams */}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="text-center">
          {renderControls()}
        </div>
      </div>
    </div>
  );
};
```

### 7. Participant Game Component

```typescript
// pages/player/PlayerGame.tsx
const PlayerGame: React.FC = () => {
  const [quizId] = useState(() => parseInt(sessionStorage.getItem('quizId') || '0'));
  const [teamId] = useState(() => parseInt(sessionStorage.getItem('teamId') || '0'));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const { connected, gameState, error, submitAnswer } = useWebSocket(quizId, 'PARTICIPANT');

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(null);
  }, [gameState?.questionNumber]);

  // Navigate to scoreboard on final results
  useEffect(() => {
    if (gameState?.state === 'FINAL_RESULTS') {
      navigate(`/player/scoreboard?quizId=${quizId}&final=true`);
    }
  }, [gameState?.state, quizId, navigate]);

  const handleSelectOption = (option: string) => {
    if (!submitted && gameState?.state === 'QUESTION') {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    if (selectedOption && !submitted && gameState?.currentQuestion) {
      submitAnswer({
        type: 'SUBMIT_ANSWER',
        teamId,
        questionId: gameState.currentQuestion.id,
        selectedOption,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    }
  };

  const getOptionStyle = (option: string, index: number) => {
    const baseStyle = 'p-6 rounded-lg border-2 transition-all cursor-pointer';
    const colors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-600', 'bg-green-600'];
    
    if (gameState?.state === 'ANSWER_REVEAL') {
      // Show correct/incorrect styling
      const isThisCorrect = option === gameState.currentQuestion?.correctAnswer;
      if (isThisCorrect) return `${baseStyle} bg-success border-success`;
      if (selectedOption === option && !isThisCorrect) return `${baseStyle} bg-error border-error`;
      return `${baseStyle} ${colors[index]} border-transparent opacity-50`;
    }
    
    if (selectedOption === option) {
      return `${baseStyle} ${colors[index]} border-accent scale-105`;
    }
    
    return `${baseStyle} ${colors[index]} border-transparent hover:scale-102`;
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            Q{gameState?.questionNumber}/{gameState?.totalQuestions}
          </p>
          <Timer timeRemaining={gameState?.timeRemaining || 0} large />
        </div>

        {/* Question */}
        {gameState?.state === 'QUESTION' && gameState.currentQuestion && (
          <>
            <div className="mb-8 p-6 bg-primary-dark rounded-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white text-center">
                {gameState.currentQuestion.text}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {gameState.currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(option)}
                  disabled={submitted}
                  className={getOptionStyle(option, index)}
                >
                  <span className="text-white font-bold text-lg">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </button>
              ))}
            </div>

            {/* Submit Button */}
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="w-full py-4 bg-accent text-black font-black text-xl rounded-lg disabled:opacity-50"
              >
                Submit Answer
              </button>
            ) : (
              <div className="text-center p-4 bg-success-light rounded-lg">
                <p className="text-white font-bold">Answer Submitted!</p>
                <p className="text-gray-300 text-sm">Waiting for results...</p>
              </div>
            )}
          </>
        )}

        {/* Buffer State */}
        {gameState?.state === 'BUFFER' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-white text-xl">Time's up!</p>
            <p className="text-gray-400">Waiting for answer reveal...</p>
          </div>
        )}

        {/* Answer Reveal State */}
        {gameState?.state === 'ANSWER_REVEAL' && (
          <div className="text-center">
            <div className={`p-8 rounded-lg mb-6 ${isCorrect ? 'bg-success' : 'bg-error'}`}>
              <p className="text-4xl mb-2">{isCorrect ? '✓' : '✗'}</p>
              <p className="text-white text-2xl font-bold">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
            </div>
            <p className="text-gray-400">Waiting for scoreboard...</p>
          </div>
        )}

        {/* Scoreboard State */}
        {gameState?.state === 'SCOREBOARD' && (
          <ScoreboardDisplay rankings={gameState.rankings} teamId={teamId} />
        )}
      </div>
    </div>
  );
};
```



### 8. Shared Components

**Timer Component:**
```typescript
// components/Timer.tsx
interface TimerProps {
  timeRemaining: number;
  large?: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining, large = false }) => {
  const percentage = (timeRemaining / 30) * 100; // Assuming 30s default
  const isLow = timeRemaining <= 5;

  return (
    <div className={`flex items-center gap-2 ${large ? 'text-4xl' : 'text-2xl'}`}>
      <div className={`font-black ${isLow ? 'text-error animate-pulse' : 'text-accent'}`}>
        {timeRemaining}s
      </div>
      {large && (
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isLow ? 'bg-error' : 'bg-accent'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

**ScoreboardDisplay Component:**
```typescript
// components/ScoreboardDisplay.tsx
interface ScoreboardDisplayProps {
  rankings: Array<{
    rank: number;
    teamId: number;
    teamName: string;
    score: number;
  }>;
  teamId?: number;
  isFinal?: boolean;
}

const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({ 
  rankings, 
  teamId, 
  isFinal = false 
}) => {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-400 text-black';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-primary-dark text-white';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-accent text-center mb-8">
        {isFinal ? '🏆 Final Results' : 'Scoreboard'}
      </h2>

      <div className="space-y-3">
        {rankings.map((entry) => (
          <div
            key={entry.teamId}
            className={`flex items-center p-4 rounded-lg ${getRankStyle(entry.rank)} ${
              entry.teamId === teamId ? 'ring-2 ring-accent' : ''
            }`}
          >
            <div className="w-12 text-center font-black text-2xl">
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
            </div>
            <div className="flex-1 ml-4">
              <p className="font-bold text-lg">{entry.teamName}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-2xl">{entry.score}</p>
              <p className="text-sm opacity-75">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**TeamGrid Component:**
```typescript
// components/TeamGrid.tsx
interface TeamGridProps {
  teams: Array<{
    id: number;
    name: string;
    connected: boolean;
  }>;
}

const TeamGrid: React.FC<TeamGridProps> = ({ teams }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className={`p-4 rounded-lg border-2 transition-all ${
            team.connected
              ? 'bg-primary-dark border-success animate-fade-in'
              : 'bg-gray-900 border-gray-700 opacity-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${team.connected ? 'bg-success' : 'bg-gray-500'}`} />
            <p className="text-white font-bold truncate">{team.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Data Models

### Session Storage Schema

```typescript
// Proctor Session
interface ProctorSession {
  role: 'PROCTOR';
  quizId: number;
  quizTitle: string;
  proctorPin: string;
}

// Participant Session
interface ParticipantSession {
  role: 'PARTICIPANT';
  quizId: number;
  teamId: number;
  teamName: string;
  teamCode: string;
}
```

### Game State Machine

```
LOBBY → QUESTION → BUFFER → ANSWER_REVEAL → SCOREBOARD → QUESTION (loop)
                                                       ↓
                                               FINAL_RESULTS
```

**State Transitions:**
- `LOBBY` → `QUESTION`: Proctor clicks "Start Quiz"
- `QUESTION` → `BUFFER`: Timer expires OR proctor clicks "End Question"
- `BUFFER` → `ANSWER_REVEAL`: Proctor clicks "Reveal Answer"
- `ANSWER_REVEAL` → `SCOREBOARD`: Proctor clicks "Show Scoreboard"
- `SCOREBOARD` → `QUESTION`: Proctor clicks "Next Question" (if more questions)
- `SCOREBOARD` → `FINAL_RESULTS`: Proctor clicks "End Quiz" (last question)



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Access Code Routing Consistency

*For any* valid access code submitted to the system, if the code resolves to type HOST, the user SHALL be routed to the proctor lobby; if the code resolves to type PARTICIPANT, the user SHALL be routed to the player lobby; if the code is INVALID, an error message SHALL be displayed.

**Validates: Requirements 1.4, 1.5, 1.6**

### Property 2: Team Grid Real-Time Updates

*For any* team connection or disconnection event received via WebSocket, the team grid display SHALL update to reflect the current set of connected teams within one render cycle.

**Validates: Requirements 2.3, 2.7**

### Property 3: Game State Transition Navigation

*For any* game state change received via WebSocket, the participant interface SHALL navigate to the appropriate view (lobby → game → scoreboard) corresponding to the new state.

**Validates: Requirements 3.4**

### Property 4: Question Display Completeness

*For any* question in QUESTION state, the participant interface SHALL display the question text, all answer options, and a countdown timer with the correct time remaining.

**Validates: Requirements 4.2, 5.1**

### Property 5: Proctor Command Dispatch

*For any* control button click by the proctor, the system SHALL send the corresponding WebSocket command (START_QUIZ, SHOW_BUFFER, REVEAL_ANSWER, SHOW_SCOREBOARD, NEXT_QUESTION, or END_QUIZ) to the server.

**Validates: Requirements 4.7**

### Property 6: Answer Selection Highlighting

*For any* answer option selected by a participant before submission, that option SHALL be visually highlighted and distinguishable from unselected options.

**Validates: Requirements 5.2**

### Property 7: Answer Submission Flow

*For any* answer submission by a participant, the system SHALL send the submission via WebSocket AND disable further submissions AND display a confirmation message.

**Validates: Requirements 5.3, 5.4**

### Property 8: Timer Expiration Submission Block

*For any* question where the timer has expired (timeRemaining <= 0), the system SHALL prevent answer submission regardless of user interaction.

**Validates: Requirements 5.5**

### Property 9: Scoreboard Ranking Correctness

*For any* scoreboard display, teams SHALL be sorted by score in descending order, each team SHALL display name, score, and rank, tied scores SHALL result in equal ranks, and the top 3 teams SHALL have distinct visual styling.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 10: WebSocket State Broadcast

*For any* game state change on the server, all connected clients subscribed to `/topic/quiz/{quizId}/state` SHALL receive the state update message.

**Validates: Requirements 6.2**

### Property 11: Submission Notification Broadcast

*For any* answer submission by a team, the proctor client subscribed to `/topic/quiz/{quizId}/host` SHALL receive a submission notification containing the team information.

**Validates: Requirements 6.3**

### Property 12: Session Persistence

*For any* successful access code login, the session information (role, quizId, teamId/proctorPin) SHALL be stored in browser sessionStorage and retrievable after page refresh.

**Validates: Requirements 10.1, 10.2**

### Property 13: API Loading State

*For any* API request in pending state, the UI SHALL display a loading indicator, and upon failure, SHALL display a user-friendly error message.

**Validates: Requirements 8.1, 8.2**

### Property 14: Session Cleanup on Disconnect

*For any* manual disconnect action by a user, the system SHALL close the WebSocket connection AND clear all session data from browser storage.

**Validates: Requirements 10.4**

### Property 15: Form Validation Feedback

*For any* form submission with invalid input (empty access code, whitespace-only input), the system SHALL display inline validation errors and prevent submission.

**Validates: Requirements 8.7**

## Error Handling

### Error Categories

1. **Network Errors**
   - API request failures
   - WebSocket connection failures
   - Timeout errors

2. **Validation Errors**
   - Invalid access codes
   - Empty form submissions
   - Malformed input

3. **State Errors**
   - Unexpected game state transitions
   - Session expiration
   - Quiz session ended

### Error Handling Strategy

```typescript
// Error types
type ErrorType = 'NETWORK' | 'VALIDATION' | 'AUTH' | 'STATE' | 'UNKNOWN';

interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  action?: () => void;
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Invalid code. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  QUIZ_ENDED: 'This quiz session has ended.',
};

// Error boundary component
const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<AppError | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md p-8 bg-error-light rounded-lg text-center">
          <p className="text-white text-xl mb-4">{error.message}</p>
          {error.recoverable && error.action && (
            <button onClick={error.action} className="btn-primary">
              Try Again
            </button>
          )}
          <a href="/" className="block mt-4 text-accent">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Component Rendering Tests**
   - Login pages render correct input fields
   - Lobby pages display connection status
   - Game pages render question and options
   - Scoreboard displays rankings correctly

2. **Form Validation Tests**
   - Empty input rejection
   - Whitespace-only input rejection
   - Valid input acceptance

3. **Error Handling Tests**
   - Network error display
   - Invalid code error display
   - Connection failure handling

### Property-Based Tests

Property-based tests will use a testing library (e.g., fast-check) to verify universal properties:

1. **Access Code Routing Property Test**
   - Generate random valid/invalid codes
   - Verify routing behavior matches code type

2. **Scoreboard Ranking Property Test**
   - Generate random team scores
   - Verify sorting and ranking correctness

3. **Timer Submission Block Property Test**
   - Generate random timer states
   - Verify submission is blocked when timer <= 0

4. **Session Storage Property Test**
   - Generate random session data
   - Verify storage and retrieval consistency

### Integration Tests

1. **WebSocket Connection Tests**
   - Connection establishment
   - Message sending/receiving
   - Reconnection on failure

2. **API Integration Tests**
   - Access code resolution
   - Error response handling

### Testing Configuration

- Property-based tests: minimum 100 iterations per property
- Test framework: Vitest with React Testing Library
- Property testing library: fast-check
- Each property test tagged with: **Feature: proctor-participant-ui, Property {N}: {description}**

