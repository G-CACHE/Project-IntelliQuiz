# Game Workflow & Active Proctoring — Task List

## Status Key
- [ ] Not started
- [x] Complete

---

## Backend Tasks

### Enums & Entities
- [ ] **T01** Update `SystemRole` enum — add EXAMINER, PROCTOR, PARTICIPANT
- [ ] **T02** Create `NavigationMode` enum (LINEAR, NON_LINEAR)
- [ ] **T03** Create `ViolationType` enum (TAB_SWITCH, COPY_ATTEMPT, RIGHT_CLICK, PRINT_SCREEN)
- [ ] **T04** Update `Quiz` entity — add navigationMode, globalTimeLimitSeconds
- [ ] **T05** Enhance `QuestionBankItem` entity — add category, isHarvested
- [ ] **T06** Create `ViolationRecord` entity in realtime module

### Repository & Service
- [ ] **T07** Create ViolationRecord repository (port + JPA + adapter)
- [ ] **T08** Create `ProctorSessionService` — violation tracking, auto-kick, manual kick
- [ ] **T09** Update `QuizSessionManager` — add kickedTeams, violationCounts, autoKickThresholds
- [ ] **T10** Update `GameFlowService` — add NON_LINEAR navigation + global timer logic
- [ ] **T11** Enhance question bank service — harvest + import methods

### WebSocket & Controllers
- [ ] **T12** Create WebSocket DTOs — ViolationReportMessage, KickMessage, ThresholdMessage, NavigateMessage
- [ ] **T13** Update `QuizWebSocketController` — violation, kick, threshold, navigate mappings
- [ ] **T14** Update security config for new roles

## Frontend Tasks

### API & Hooks
- [ ] **T15** Update `api.ts` — new types, question bank endpoints, proctoring endpoints
- [ ] **T16** Update `AuthContext` — new role support + helpers
- [ ] **T17** Enhance `useWebSocket` — violations, kicks, navigation channels

### Components & Screens
- [ ] **T18** Create `AntiCheatWrapper` component — tab detection + UI blocking
- [ ] **T19** Create `SessionTerminated` page — kicked participant screen
- [ ] **T20** Create `ProctorDashboard` — violation panel, kick controls, auto-kick threshold
- [ ] **T21** Create `QuestionBankPage` — CRUD for examiner question bank
- [ ] **T22** Create `QuestionPalette` — non-linear question navigation sidebar
- [ ] **T23** Update `PlayerGame` — integrate anti-cheat + question palette
- [ ] **T24** Update router — add examiner, proctor, session-terminated routes

## Verification
- [ ] **T25** Backend compile check (`mvn clean compile`)
- [ ] **T26** Frontend build check (`npm run build`)
