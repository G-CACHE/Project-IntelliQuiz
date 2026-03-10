# Game Workflow & Active Proctoring — Implementation Plan

## Phase 1 — Backend Enums & Entities

### 1.1 Update SystemRole Enum
- File: `shared/enums/SystemRole.java`
- Add: `EXAMINER`, `PROCTOR`, `PARTICIPANT`
- Keep `ADMIN` as alias for `EXAMINER` (backward compat) or rename

### 1.2 Create NavigationMode Enum
- New: `shared/enums/NavigationMode.java`
- Values: `LINEAR`, `NON_LINEAR`

### 1.3 Create ViolationType Enum
- New: `shared/enums/ViolationType.java`
- Values: `TAB_SWITCH`, `COPY_ATTEMPT`, `RIGHT_CLICK`, `PRINT_SCREEN`

### 1.4 Update Quiz Entity
- File: `quiz/internal/domain/entities/Quiz.java`
- Add `navigationMode` (NavigationMode, default LINEAR)
- Add `globalTimeLimitSeconds` (int, default 0)
- Add getters/setters per project convention

### 1.5 Enhance QuestionBankItem Entity
- File: `quiz/internal/domain/entities/QuestionBankItem.java`
- Add `category` (String, nullable)
- Add `isHarvested` (boolean, default false)

### 1.6 Create ViolationRecord Entity
- New: `realtime/internal/domain/entities/ViolationRecord.java`
- Extends SoftDeletableEntity
- Fields: quizId, teamId, violationType, detectedAt

## Phase 2 — Backend Repository & Service

### 2.1 ViolationRecord Repository
- New port interface: `realtime/internal/domain/ports/ViolationRecordRepositoryPort.java`
- New Spring Data repo: `realtime/internal/infrastructure/persistence/ViolationRecordJpaRepository.java`
- New adapter: `realtime/internal/infrastructure/persistence/ViolationRecordRepositoryAdapter.java`

### 2.2 ProctorSessionService
- New: `realtime/internal/application/services/ProctorSessionService.java`
- Manages in-memory auto-kick thresholds and violation counters
- Methods: setAutoKickThreshold, reportViolation, kickParticipant, getViolationCounts

### 2.3 Update QuizSessionManager
- Add: `kickedTeams` map, `violationCounts` map, `autoKickThresholds` map
- Methods: isKicked, addKicked, getViolationCount, incrementViolation

### 2.4 Update GameFlowService
- Add NON_LINEAR navigation: `navigateToQuestion(quizId, teamId, questionIndex)`
- Add global timer management for NON_LINEAR mode
- Add auto-submit on global timeout

### 2.5 Enhance QuestionBankService
- Add: `harvestInstantQuestions(quizId, examinerId)`
- Add: `importFromBank(bankItemIds, quizId)`

## Phase 3 — Backend WebSocket & Controllers

### 3.1 Update QuizWebSocketController
- New mappings:
  - `@MessageMapping("/quiz/{quizId}/violation")` — report violation
  - `@MessageMapping("/quiz/{quizId}/kick")` — manual kick
  - `@MessageMapping("/quiz/{quizId}/set-threshold")` — auto-kick threshold
  - `@MessageMapping("/quiz/{quizId}/navigate")` — question navigation

### 3.2 Update WebSocket Security
- Ensure proctor principal type can send kick/threshold commands
- Ensure participant principal type can send violation/navigate commands

### 3.3 DTOs for WebSocket Messages
- `ViolationReportMessage` — type field
- `KickMessage` — teamId, reason
- `ThresholdMessage` — threshold value
- `NavigateMessage` — questionIndex

## Phase 4 — Backend Security & Config

### 4.1 Update SecurityConfig
- Role-based endpoint access for new roles
- Ensure backward compatibility

### 4.2 Update Auth Service  
- Support new role types in token generation/validation

## Phase 5 — Frontend API & Hooks

### 5.1 Update API Types
- Update `api.ts` with new role types, navigation mode types
- Add question bank API functions
- Add proctoring API endpoints

### 5.2 Update AuthContext
- Support new roles (EXAMINER, PROCTOR, PARTICIPANT)
- Add role-check helpers

### 5.3 Enhance useWebSocket Hook
- Add violation reporting/receiving
- Add kick sending/receiving  
- Add navigation for NON_LINEAR mode
- Add auto-kick threshold setting

## Phase 6 — Frontend Screens

### 6.1 Anti-Cheat Components
- `AntiCheatWrapper` — Tab detection + UI blocking HOC
- `SessionTerminated` — Kicked participant screen

### 6.2 Proctor Dashboard
- `ProctorDashboard` — Real-time violation panel, kick buttons, auto-kick controls

### 6.3 Question Bank Screen
- `QuestionBankPage` — CRUD for personal question bank

### 6.4 Quiz Editor Enhancement  
- Navigation mode toggle (LINEAR/NON_LINEAR)
- Import from bank dialog

### 6.5 Non-Linear Game Screen
- `QuestionPalette` — Sidebar for jumping between questions
- Updated PlayerGame with palette integration

### 6.6 Router Updates
- Add new routes for examiner, proctor pages
- Update protected route helpers

## Phase 7 — Verification

### 7.1 Backend Build
- `mvn clean compile` to ensure no compilation errors

### 7.2 Frontend Build
- `npm run build` to verify TypeScript compilation
