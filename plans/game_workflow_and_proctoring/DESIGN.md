# Game Workflow & Active Proctoring — Design

## 1. Backend Architecture (Spring Modulith)

### 1.1 Enum Changes

**`SystemRole`** — Add `EXAMINER`, `PROCTOR`, `PARTICIPANT`:
```java
SUPER_ADMIN, EXAMINER, PROCTOR, PARTICIPANT
```
> `ADMIN` is **renamed** to `EXAMINER`. A DB migration updates existing rows.

**New enum `NavigationMode`** in `shared/enums/`:
```java
LINEAR,      // Strict Progression — per-question timers, forward-only
NON_LINEAR   // Participant-Controlled — global timer, free navigation
```

### 1.2 Entity Changes

#### Quiz Entity — New Fields
| Field | Type | Column | Default | Description |
|-------|------|--------|---------|-------------|
| `navigationMode` | `NavigationMode` | `navigation_mode` | `LINEAR` | Assessment navigation mode |
| `globalTimeLimitSeconds` | `int` | `global_time_limit_seconds` | `0` | Whole-quiz timer for NON_LINEAR mode |

#### QuestionBankItem Entity — Enhanced
Already exists. Add:
| Field | Type | Column | Description |
|-------|------|--------|-------------|
| `category` | `String` | `category` | Optional grouping tag |
| `isHarvested` | `boolean` | `is_harvested` | True if auto-harvested from instant question |

#### New Entity: ViolationRecord (in `realtime` module)
| Field | Type | Column | Description |
|-------|------|--------|-------------|
| `id` | `Long` | `id` | PK, auto-generated |
| `quizId` | `Long` | `quiz_id` | Which quiz session |
| `teamId` | `Long` | `team_id` | Which team/participant |
| `violationType` | `ViolationType` | `violation_type` | TAB_SWITCH, COPY_ATTEMPT, etc. |
| `detectedAt` | `LocalDateTime` | `detected_at` | When violation occurred |

**New enum `ViolationType`**: `TAB_SWITCH`, `COPY_ATTEMPT`, `RIGHT_CLICK`, `PRINT_SCREEN`

### 1.3 Service Design

#### GameFlowService — Assessment Mode Logic
- **LINEAR mode**: Per-question timer (existing behavior). On timeout/submit → auto-advance, lock previous.
- **NON_LINEAR mode**: Global timer. Participants can jump to any question. Track answered questions per team. On global timeout → auto-submit all.

#### ProctorSessionService (new, in `realtime` module)
- `setAutoKickThreshold(quizId, threshold)` — stores threshold in memory
- `reportViolation(quizId, teamId, type)` — increments counter, checks threshold, broadcasts to proctor
- `kickParticipant(quizId, teamId)` — terminates participant session, broadcasts kick event
- `getViolationCounts(quizId)` → `Map<Long, Integer>` — returns all violation counts

#### QuestionBankService — Harvest Logic  
- `harvestInstantQuestions(quizId, examinerId)` — after quiz save, any question without a bankItemId gets persisted to bank
- `importFromBank(bankItemIds, quizId)` — copies bank items as quiz questions

### 1.4 WebSocket Channel Design

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `/app/quiz/{quizId}/violation` | Participant → Server | `{type: "TAB_SWITCH"}` | Report a violation |
| `/topic/quiz/{quizId}/violations` | Server → Proctor | `{teamId, teamName, count, type}` | Violation broadcast |
| `/topic/quiz/{quizId}/kick` | Server → Participant | `{teamId, reason}` | Kick notification |
| `/app/quiz/{quizId}/set-threshold` | Proctor → Server | `{threshold: 3}` | Set auto-kick threshold |
| `/app/quiz/{quizId}/kick` | Proctor → Server | `{teamId}` | Manual kick |
| `/app/quiz/{quizId}/navigate` | Participant → Server | `{questionIndex}` | Jump to question (NON_LINEAR) |
| `/topic/quiz/{quizId}/navigation` | Server → Participant | `{questionIndex, question}` | Question for navigation |

### 1.5 Security Configuration

Update `SecurityFilterChain`:
- `ROLE_SUPER_ADMIN` — `/api/users/**`, all admin endpoints
- `ROLE_EXAMINER` — `/api/quizzes/**`, `/api/questions/**`, `/api/question-bank/**`
- `ROLE_PROCTOR` — `/api/access/**` (login via access code)
- `ROLE_PARTICIPANT` — `/api/access/**` (login via team code)
- Public: `/api/auth/**`, `/api/access/**`, `/ws/**`

## 2. Frontend Architecture

### 2.1 New Screens

| Route | Component | Role | Description |
|-------|-----------|------|-------------|
| `/examiner` | `ExaminerLayout` | EXAMINER | Dashboard with sidebar |
| `/examiner/quizzes` | `ExaminerQuizzesPage` | EXAMINER | Quiz management |
| `/examiner/quizzes/:quizId/edit` | `QuizEditorPage` | EXAMINER | Quiz builder with bank integration |
| `/examiner/question-bank` | `QuestionBankPage` | EXAMINER | Personal question bank |
| `/proctor/dashboard` | `ProctorDashboard` | PROCTOR | Live session monitoring |
| `/player/game` | Enhanced `PlayerGame` | PARTICIPANT | With anti-cheat + question palette |
| `/session-terminated` | `SessionTerminated` | PARTICIPANT | Kicked/terminated screen |

### 2.2 Enhanced Game Components

- **QuestionPalette**: Sidebar showing all questions (answered/unanswered/current) for NON_LINEAR mode
- **ViolationPanel**: Proctor dashboard showing per-team violation counts with kick buttons
- **AntiCheatWrapper**: HOC that wraps game screens with tab detection + UI blocking
- **AutoKickModal**: Proctor dialog to set auto-kick threshold

### 2.3 Anti-Cheat Client Logic

```typescript
// Detect tab switches
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sendViolation('TAB_SWITCH');
});
window.addEventListener('blur', () => sendViolation('TAB_SWITCH'));

// Block common shortcuts and actions
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if ((e.ctrlKey && ['c','v','p'].includes(e.key)) || e.key === 'PrintScreen') {
    e.preventDefault();
    sendViolation(e.key === 'PrintScreen' ? 'PRINT_SCREEN' : 'COPY_ATTEMPT');
  }
});
document.addEventListener('selectstart', e => e.preventDefault());
```

### 2.4 WebSocket Hook Extensions

Add to `useWebSocket`:
- `violations` state: `Map<teamId, {count, lastType}>`
- `kickedTeams` state: `Set<teamId>`
- `sendViolation(type)` — sends to `/app/quiz/{quizId}/violation`
- `kickParticipant(teamId)` — sends to `/app/quiz/{quizId}/kick`
- `setAutoKickThreshold(threshold)` — sends to `/app/quiz/{quizId}/set-threshold`
- `navigateToQuestion(index)` — sends to `/app/quiz/{quizId}/navigate` (NON_LINEAR)
- Subscribe to `/topic/quiz/{quizId}/violations` and `/topic/quiz/{quizId}/kick`
