# Frontend SSE Migration Guide

This document shows how to migrate from `useWebSocket` to `useSSE` for real-time quiz updates.

## Quick Summary

**Old (WebSocket/STOMP):**
```typescript
const ws = useWebSocket(quizId, 'PARTICIPANT', teamId, accessCode)
// WebSocket handles connection, STOMP handles messaging
// Bidirectional: client → server and server → client
```

**New (SSE + REST):**
```typescript
const sse = useSSE(quizId, 'PARTICIPANT', teamId, accessCode)
// SSE handles one-way server → client streaming
// REST handles client → server commands and submissions
```

## State Mapping (No Changes!)

The hook returns the same state structure, so **UI components don't need to change**:

```typescript
{
  // Connection state (same)
  connected: boolean
  connecting: boolean
  error: string | null

  // Game state (same)
  gameState: string               // 'ACTIVE', 'REVEAL', etc.
  currentQuestion: object         // { id, text, options, ... }
  questionNumber: number
  totalQuestions: number
  timeRemaining: number           // Updated every 1 second via SSE

  // Team state (same)
  connectedTeams: any[]
  submissions: any[]
  rankings: any[]
  violations: any[]
  kicked: boolean
  kickReason: string | null

  // Methods (same)
  submitAnswer, sendCommand, reportViolation, kickTeam, ...
}
```

---

## HostGame.tsx Migration

### Before (WebSocket)
```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

export function HostGame({ quizId, proctorPin }: Props) {
  const ws = useWebSocket(quizId, 'HOST', undefined, proctorPin)

  const handleStartRound = () => {
    ws.sendCommand({ type: 'START_ROUND' })
  }

  const handlePause = () => {
    ws.sendCommand({ type: 'PAUSE' })
  }

  return (
    <div>
      <Timer timeRemaining={ws.timeRemaining} />
      <QuestionDisplay question={ws.currentQuestion} />
      <TeamGrid teams={ws.connectedTeams} submissions={ws.submissions} />
      <button onClick={handleStartRound}>Start Round</button>
      <button onClick={handlePause}>Pause</button>
      {ws.error && <ErrorBanner message={ws.error} />}
    </div>
  )
}
```

### After (SSE + REST)
```typescript
import { useSSE } from '@/hooks/useSSE'  // ← Changed import

export function HostGame({ quizId, proctorPin }: Props) {
  const sse = useSSE(quizId, 'HOST', undefined, proctorPin)  // ← Changed hook call

  const handleStartRound = () => {
    sse.sendCommand({ type: 'START_ROUND' })  // Same method!
  }

  const handlePause = () => {
    sse.sendCommand({ type: 'PAUSE' })  // Same method!
  }

  return (
    <div>
      <Timer timeRemaining={sse.timeRemaining} />
      <QuestionDisplay question={sse.currentQuestion} />
      <TeamGrid teams={sse.connectedTeams} submissions={sse.submissions} />
      <button onClick={handleStartRound}>Start Round</button>
      <button onClick={handlePause}>Pause</button>
      {sse.error && <ErrorBanner message={sse.error} />}
    </div>
  )
}
```

**Changes:** Just swap `useWebSocket` → `useSSE` and `ws` → `sse`. Everything else stays the same!

---

## ParticipantGame.tsx Migration

### Before (WebSocket)
```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

export function ParticipantGame({ quizId, teamId, teamName, accessCode }: Props) {
  const ws = useWebSocket(quizId, 'PARTICIPANT', teamId, accessCode)

  const handleAnswerSubmit = (answer: string) => {
    ws.submitAnswer({
      teamId,
      questionId: ws.currentQuestion.id,
      answer,
      timestamp: new Date().toISOString()
    })
  }

  const handleTabSwitch = () => {
    ws.reportViolation('TAB_SWITCH')
  }

  return (
    <div>
      {ws.kicked ? (
        <div className="error">{ws.kickReason}</div>
      ) : (
        <>
          <Timer timeRemaining={ws.timeRemaining} />
          <QuestionDisplay question={ws.currentQuestion} />
          <AnswerOptions
            options={ws.currentQuestion?.options}
            onSubmit={handleAnswerSubmit}
          />
          <AntiCheatWrapper onViolation={handleTabSwitch} />
          <ScoreboardDisplay rankings={ws.rankings} />
        </>
      )}
      {ws.error && <ErrorBanner message={ws.error} />}
    </div>
  )
}
```

### After (SSE + REST)
```typescript
import { useSSE } from '@/hooks/useSSE'  // ← Changed

export function ParticipantGame({ quizId, teamId, teamName, accessCode }: Props) {
  const sse = useSSE(quizId, 'PARTICIPANT', teamId, accessCode)  // ← Changed

  const handleAnswerSubmit = (answer: string) => {
    sse.submitAnswer({  // Same method!
      teamId,
      questionId: sse.currentQuestion.id,
      answer,
      timestamp: new Date().toISOString()
    })
  }

  const handleTabSwitch = () => {
    sse.reportViolation('TAB_SWITCH')  // Same method!
  }

  return (
    <div>
      {sse.kicked ? (  // Same property!
        <div className="error">{sse.kickReason}</div>
      ) : (
        <>
          <Timer timeRemaining={sse.timeRemaining} />
          <QuestionDisplay question={sse.currentQuestion} />
          <AnswerOptions
            options={sse.currentQuestion?.options}
            onSubmit={handleAnswerSubmit}
          />
          <AntiCheatWrapper onViolation={handleTabSwitch} />
          <ScoreboardDisplay rankings={sse.rankings} />
        </>
      )}
      {sse.error && <ErrorBanner message={sse.error} />}
    </div>
  )
}
```

**Changes:** Again, just swap the hook and variable names. All logic remains identical!

---

## ProctorDashboard.tsx Migration

### Before (WebSocket)
```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

export function ProctorDashboard({ quizId }: Props) {
  const ws = useWebSocket(quizId, 'PROCTOR')

  const handleKickTeam = (teamId: string) => {
    ws.kickTeam(teamId, 'Cheating detected')
  }

  const handleSetThreshold = (count: number) => {
    ws.setAutoKickThreshold(count)
  }

  return (
    <div>
      <ViolationsList violations={ws.violations} />
      <TeamList
        teams={ws.connectedTeams}
        onKick={handleKickTeam}
      />
      <ThresholdSetter
        onSet={handleSetThreshold}
      />
    </div>
  )
}
```

### After (SSE + REST)
```typescript
import { useSSE } from '@/hooks/useSSE'  // ← Changed

export function ProctorDashboard({ quizId }: Props) {
  const sse = useSSE(quizId, 'PROCTOR')  // ← Changed

  const handleKickTeam = (teamId: string) => {
    sse.kickTeam(teamId, 'Cheating detected')  // Same!
  }

  const handleSetThreshold = (count: number) => {
    sse.setAutoKickThreshold(count)  // Same!
  }

  return (
    <div>
      <ViolationsList violations={sse.violations} />
      <TeamList
        teams={sse.connectedTeams}
        onKick={handleKickTeam}
      />
      <ThresholdSetter
        onSet={handleSetThreshold}
      />
    </div>
  )
}
```

---

## Supporting Components (No Changes Needed!)

These components work with both WebSocket and SSE because the hook returns the same interface:

- **Timer.tsx** — Just displays `timeRemaining`, no logic changes
- **QuestionDisplay.tsx** — Just displays `currentQuestion`, no logic changes
- **ScoreboardDisplay.tsx** — Just displays `rankings`, no logic changes
- **AntiCheatWrapper.tsx** — Calls `reportViolation()`, method signature identical
- **TeamGrid.tsx** — Just displays `connectedTeams` and `submissions`, no changes

---

## Error Handling (Same Pattern)

```typescript
{error && (
  <ErrorAlert message={error} />
)}
```

Works the same with `useSSE` as it did with `useWebSocket`.

---

## Connection Status (Same Pattern)

```typescript
{!connected && (
  <div>
    {connecting && <Spinner />}
    {!connecting && <ReconnectButton onClick={() => sse.reconnect()} />}
  </div>
)}
```

Same lifecycle and states with `useSSE`.

---

## Testing Migration

### Before (WebSocket mock)
```typescript
jest.mock('@/hooks/useWebSocket')
const mockUseWebSocket = useWebSocket as jest.Mock

mockUseWebSocket.mockReturnValue({
  connected: true,
  gameState: 'ACTIVE',
  currentQuestion: { id: '1', text: 'Q1', options: [...] },
  timeRemaining: 30,
  // ... other state
  sendCommand: jest.fn(),
  submitAnswer: jest.fn(),
})
```

### After (SSE mock)
```typescript
jest.mock('@/hooks/useSSE')
const mockUseSSE = useSSE as jest.Mock

mockUseSSE.mockReturnValue({
  connected: true,
  gameState: 'ACTIVE',
  currentQuestion: { id: '1', text: 'Q1', options: [...] },
  timeRemaining: 30,
  // ... other state
  sendCommand: jest.fn(),
  submitAnswer: jest.fn(),
})
```

Tests don't need to change because the hook interface is identical!

---

## Dependency Changes

### package.json

**Remove:**
```json
"@stomp/stompjs": "^7.2.1",
"sockjs-client": "^1.6.1"
```

**Keep all others:**
```json
"react": "^18.x",
// ... other dependencies remain
```

Run: `npm install`

---

##Summary: What Changes, What Doesn't

| Item | Change | Notes |
|------|--------|-------|
| Hook import | `useWebSocket` → `useSSE` | Single line change |
| Variable name | `ws` → `sse` | Just renaming |
| Hook call | `useWebSocket(...)` → `useSSE(...)` | Parameters identical |
| State properties | ❌ None | All same `connected`, `gameState`, `rankings`, etc. |
| Method names | ❌ None | `submitAnswer()`, `sendCommand()`, `reportViolation()` all same |
| Component logic | ❌ None | Rendering, event handlers, all unchanged |
| UI/UX | ❌ None | Imperceptible to end-users |
| Dependencies | Remove STOMP libs | Use browser-native EventSource API |

---

## Implementation Checklist

- [ ] Update `src/hooks/useSSE.ts` (already done ✓)
- [ ] Replace `useWebSocket` → `useSSE` in `HostGame.tsx`
- [ ] Replace `useWebSocket` → `useSSE` in `ParticipantGame.tsx`
- [ ] Replace `useWebSocket` → `useSSE` in `ProctorDashboard.tsx`
- [ ] Replace `useWebSocket` → `useSSE` in `HostLobby.tsx`
- [ ] Replace `useWebSocket` → `useSSE` in `HostScoreboard.tsx`
- [ ] Remove `@stomp/stompjs` and `sockjs-client` from `package.json`
- [ ] Run `npm install`
- [ ] Test all game flows (participant, host, proctor)
- [ ] Test reconnection handling
- [ ] Test error scenarios

---

## Troubleshooting

### "Cannot find module '@stomp/stompjs'"
Solution: Already removed in migration. If error persists, check for old imports with search-and-replace.

### SSE connection drops frequently
Solution: Check browser console for `/api/quiz/{quizId}/stream` 404 errors. Verify SSEConnectionRegistry is injected in backend.

### Questions not appearing after START_ROUND
Solution: Verify `broadcastGameState()` in GameFlowService calls `broadcastService.broadcastGameState()` which now uses SSE.

### Answers not being recorded
Solution: Check POST `/api/quiz/{quizId}/answer` endpoint in backend. Verify `QuizSubmissionController` is registered.

### Timer not updating
Solution: Timer events should arrive every 1 second via `TIMER_TICK` on SSE. Check `broadcastTimerTick()` in `QuizBroadcastService`.

### "Max reconnection attempts exceeded"
Solution: Check browser console and server logs. Possible causes:
- Network/firewall blocking `/api/quiz/{quizId}/stream`
- Server crashed or stopped accepting SSE connections
- Client-side infinite disconnect cycle should trigger manual reconnect button in UI

---

## Rollback Plan

If issues arise, revert to WebSocket:

1. Restore old `package.json` with `@stomp/stompjs` and `sockjs-client`
2. Git checkout `useWebSocket.ts` from main branch
3. Revert ImportChanges in game pages (change `useSSE` back to `useWebSocket`)
4. Rebuild and test

Since we kept STOMP in `QuizBroadcastService`, both can coexist during transition.
