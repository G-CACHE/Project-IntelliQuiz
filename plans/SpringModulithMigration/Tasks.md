# IntelliQuiz — Spring Modulith Migration Tasks

> **Total estimated time:** ~23 hours  
> **Reference:** [Requirements.md](Requirements.md) | [Design.md](Design.md) | [Implementation.md](Implementation.md)  
> **Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Done · `[!]` Blocked

---

## Phase 0 — Pre-Migration Cleanup (~2h)

> **Goal:** Fix architectural anti-patterns before moving any code.  
> **Commit:** `modulith(phase-0): pre-migration cleanup`

- [x] **0.1** Rewrite `BackupRecordRepository` as clean port interface (remove `JpaRepository` extension)
- [x] **0.2** Create `SpringBackupRecordRepository` (Spring Data JPA interface)
- [x] **0.3** Create `BackupRecordRepositoryImpl` adapter bridging port → Spring Data
- [x] **0.4** Update `BackupServiceImpl` — replace `deleteById()` with `findById()` + `delete()` *(already done — code already uses findById + delete)*
- [x] **0.5** Move `QuizBroadcastService` from `infrastructure.config` → `infrastructure.websocket`
- [x] **0.6** Move `QuizSessionManager` from `infrastructure.config` → `infrastructure.websocket`
- [x] **0.7** Update package declarations + imports in `GameFlowService`, `QuizWebSocketController`, `WebSocketEventListener`, `QuizTimerService` + 5 test files
- [x] **0.8** Run `mvn clean test` — all 216 tests pass ✓

---

## Phase 1 — Extract Shared Module (~1h)

> **Goal:** Create the `shared` module containing all cross-cutting types (exceptions, enums, services).  
> **Commit:** `modulith(phase-1): extract shared module`

- [x] **1.1** Create shared package structure: `shared/{exceptions,enums,services,dto,exception}`
- [x] **1.2** Create `shared/package-info.java` with `@ApplicationModule(type = OPEN)`
- [x] **1.3** Move all 11 exception classes from `domain/exceptions/` → `shared/exceptions/`
- [x] **1.4** Move all 6 enums from `domain/enums/` → `shared/enums/`
- [x] **1.5** Move `RouteType.java` from `application/services/` → `shared/enums/`
- [x] **1.6** Move `CodeGenerationService` from `domain/services/` → `shared/services/`
- [x] **1.7** Move `GlobalExceptionHandler` from `presentation/exception/` → `shared/exception/`
- [x] **1.8** Extract `ErrorResponse` record into `shared/dto/ErrorResponse.java`
- [x] **1.9** Update all import statements across the codebase (`grep -r "old.path" src/`)
- [x] **1.10** Run `mvn clean test` — all tests pass

---

## Phase 2 — Extract Auth Module (~2h)

> **Goal:** Create the `auth` module with JWT, security config, and authentication/authorization.  
> **Commit:** `modulith(phase-2): extract auth module`

- [ ] **2.1** Create auth package structure: `auth/{events,dto}` + `auth/internal/{domain/ports,application/services,infrastructure/{security,config},presentation/{controllers,dto/{request,response}}}`
- [ ] **2.2** Create `auth/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared"})`
- [ ] **2.3** Move `AuthenticationService`, `AuthorizationService`, `AccessResolutionService` + result records → `auth/internal/application/services/`
- [ ] **2.4** Move `PasswordHashingService` port → `auth/internal/domain/ports/`
- [ ] **2.5** Move `BCryptPasswordHashingService` → `auth/internal/infrastructure/security/`
- [ ] **2.6** Move `JwtConfig`, `JwtAuthenticationFilter`, `SecurityConfig`, `CorsConfig`, `OpenApiConfig` → `auth/internal/infrastructure/config/`
- [ ] **2.7** Move `AuthController`, `AccessController` → `auth/internal/presentation/controllers/`
- [ ] **2.8** Move related request/response DTOs → `auth/internal/presentation/dto/`
- [ ] **2.9** Create `AuthFacade.java` (public API: `authenticate`, `hasPermission`, `resolveAccessCode`)
- [ ] **2.10** Create public DTOs: `AuthenticationResultDto`, `AccessResolutionResultDto`
- [ ] **2.11** Update all imports across the codebase
- [ ] **2.12** Run `mvn clean test` — all tests pass

---

## Phase 3 — Extract Quiz Module (~3h)

> **Goal:** Create the `quiz` module — aggregate root with Quiz + Question entities, events, facade.  
> **Commit:** `modulith(phase-3): extract quiz module`

- [ ] **3.1** Create quiz package structure: `quiz/{events,dto}` + `quiz/internal/{domain/{entities,valueobjects,ports},application/{services,commands},infrastructure/persistence,presentation/{controllers,dto/{request,response}}}`
- [ ] **3.2** Create `quiz/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared", "auth"})`
- [ ] **3.3** Move `Quiz.java`, `Question.java` → `quiz/internal/domain/entities/`
- [ ] **3.4** Move `QuizRepository`, `QuestionRepository` ports → `quiz/internal/domain/ports/`
- [ ] **3.5** Move `QuizManagementService`, `QuestionManagementService`, `QuizSessionService` → `quiz/internal/application/services/`
- [ ] **3.6** Move quiz/question command records → `quiz/internal/application/commands/`
- [ ] **3.7** Move persistence adapters (`QuizRepositoryImpl`, `SpringQuizRepository`, etc.) → `quiz/internal/infrastructure/persistence/`
- [ ] **3.8** Move `QuizController`, `QuestionController` → `quiz/internal/presentation/controllers/`
- [ ] **3.9** Move related request/response DTOs → `quiz/internal/presentation/dto/`
- [ ] **3.10** Create 6 event records: `QuizCreatedEvent`, `QuizStatusChangedEvent`, `QuizSessionActivatedEvent`, `QuizSessionDeactivatedEvent`, `QuestionAddedEvent`, `QuestionDeletedEvent`
- [ ] **3.11** Add `ApplicationEventPublisher` to `QuizManagementService` + `QuizSessionService` — publish events after state changes
- [ ] **3.12** Create `QuizFacade.java` (public API: `getQuizInfo`, `getQuestionForGrading`, `getOrderedQuestions`, `quizExists`, `activateSession`, `deactivateSession`)
- [ ] **3.13** Create public DTOs: `QuizInfoDto`, `QuestionInfoDto`
- [ ] **3.14** Remove `@OneToMany teams` and `@OneToMany assignments` from `Quiz.java` (cross-module navigable collections)
- [ ] **3.15** Remove `getLeaderboard()` from `Quiz.java` (scoreboard is a separate module now)
- [ ] **3.16** Create `QuizSession` value object
- [ ] **3.17** Update all imports across the codebase
- [ ] **3.18** Run `mvn clean test` — all tests pass

---

## Phase 4 — Extract User Module (~2h)

> **Goal:** Create the `user` module with User + QuizAssignment entities; decouple quiz JPA reference.  
> **Commit:** `modulith(phase-4): extract user module`

- [ ] **4.1** Create user package structure: `user/{events,dto}` + `user/internal/{domain/{entities,ports},application/{services,commands},infrastructure/persistence,presentation/{controllers,dto}}`
- [ ] **4.2** Create `user/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared", "quiz"})`
- [ ] **4.3** Move `User.java`, `QuizAssignment.java` → `user/internal/domain/entities/`
- [ ] **4.4** Move `UserRepository`, `QuizAssignmentRepository` ports → `user/internal/domain/ports/`
- [ ] **4.5** Move `UserManagementService` → `user/internal/application/services/`
- [ ] **4.6** Move user command records → `user/internal/application/commands/`
- [ ] **4.7** Move persistence adapters → `user/internal/infrastructure/persistence/`
- [ ] **4.8** Move `UserController` → `user/internal/presentation/controllers/`
- [ ] **4.9** Move related DTOs → `user/internal/presentation/dto/`
- [ ] **4.10** Fix `QuizAssignment` JPA: replace `@ManyToOne Quiz quiz` → `@Column Long quizId`
- [ ] **4.11** Update `UserManagementService.assignQuizPermissions()` to use `QuizFacade.quizExists(quizId)`
- [ ] **4.12** Create 4 event records: `UserCreatedEvent`, `UserDeletedEvent`, `PermissionsAssignedEvent`, `PermissionsRevokedEvent`
- [ ] **4.13** Add event publishing to `UserManagementService`
- [ ] **4.14** Create `UserFacade.java` (public API: `getUserByUsername`, `hasPermission`)
- [ ] **4.15** Create public DTO: `UserInfoDto`
- [ ] **4.16** Update `auth` module: change `@ApplicationModule(allowedDependencies = {"shared", "user"})` + switch `AuthenticationService` to `UserFacade`
- [ ] **4.17** Update all imports across the codebase
- [ ] **4.18** Run `mvn clean test` — all tests pass

---

## Phase 5 — Extract Team Module (~1.5h)

> **Goal:** Create the `team` module; decouple quiz JPA reference; add AccessCode value object.  
> **Commit:** `modulith(phase-5): extract team module`

- [ ] **5.1** Create team package structure: `team/{events,dto}` + `team/internal/{domain/{entities,valueobjects,ports},application/services,infrastructure/persistence,presentation/{controllers,dto}}`
- [ ] **5.2** Create `team/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared", "quiz"})`
- [ ] **5.3** Move `Team.java` → `team/internal/domain/entities/`
- [ ] **5.4** Move `TeamRepository` port → `team/internal/domain/ports/`
- [ ] **5.5** Move `TeamRegistrationService` → `team/internal/application/services/`
- [ ] **5.6** Move persistence adapters → `team/internal/infrastructure/persistence/`
- [ ] **5.7** Move `TeamController` → `team/internal/presentation/controllers/`
- [ ] **5.8** Move related DTOs → `team/internal/presentation/dto/`
- [ ] **5.9** Fix `Team` JPA: replace `@ManyToOne Quiz quiz` → `@Column Long quizId`
- [ ] **5.10** Remove `submissions` navigable collection from `Team.java`
- [ ] **5.11** Update `TeamRepository` port: replace `findByQuiz(Quiz)` → `findByQuizId(Long)`
- [ ] **5.12** Update `TeamRegistrationService` to use `QuizFacade.quizExists(quizId)`
- [ ] **5.13** Create 3 event records: `TeamRegisteredEvent`, `TeamRemovedEvent`, `TeamScoreResetEvent`
- [ ] **5.14** Add event publishing to `TeamRegistrationService`
- [ ] **5.15** Create `TeamFacade.java` (public API: `getTeamInfo`, `getTeamByAccessCode`, `getTeamsByQuiz`, `getTeamCount`)
- [ ] **5.16** Create public DTO: `TeamInfoDto`
- [ ] **5.17** Create `AccessCode` value object (record with validation)
- [ ] **5.18** Update all imports across the codebase
- [ ] **5.19** Run `mvn clean test` — all tests pass

---

## Phase 6 — Extract Submission Module (~2h)

> **Goal:** Create the `submission` module; decouple team + question JPA references; wire event listeners.  
> **Commit:** `modulith(phase-6): extract submission module`

- [ ] **6.1** Create submission package structure: `submission/{events,dto}` + `submission/internal/{domain/{entities,ports},application/{services,listeners},infrastructure/persistence,presentation/{controllers,dto}}`
- [ ] **6.2** Create `submission/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared", "quiz", "team"})`
- [ ] **6.3** Move `Submission.java` → `submission/internal/domain/entities/`
- [ ] **6.4** Move `SubmissionRepository` port → `submission/internal/domain/ports/`
- [ ] **6.5** Move `SubmissionService` → `submission/internal/application/services/`
- [ ] **6.6** Move persistence adapters → `submission/internal/infrastructure/persistence/`
- [ ] **6.7** Move `SubmissionController` → `submission/internal/presentation/controllers/`
- [ ] **6.8** Move related DTOs → `submission/internal/presentation/dto/`
- [ ] **6.9** Fix `Submission` JPA: replace `@ManyToOne Team team` → `@Column Long teamId`
- [ ] **6.10** Fix `Submission` JPA: replace `@ManyToOne Question question` → `@Column Long questionId`
- [ ] **6.11** Update `SubmissionService` to use `QuizFacade.getQuestionForGrading()` + `TeamFacade.getTeamInfo()`
- [ ] **6.12** Update `SubmissionRepository` port: add `findByTeamIdAndQuestionId`, `deleteByQuestionId`, `deleteByTeamId`
- [ ] **6.13** Create 2 event records: `AnswerSubmittedEvent`, `SubmissionGradedEvent`
- [ ] **6.14** Add event publishing to `SubmissionService`
- [ ] **6.15** Create `SubmissionEventListener` — listens for `QuestionDeletedEvent` + `TeamRemovedEvent` (cascade cleanup)
- [ ] **6.16** Create `SubmissionFacade.java` (public API: `submitAnswer`, `submitAnswerWithGrading`, `hasSubmitted`, `countSubmissionsForQuestion`)
- [ ] **6.17** Create public DTO: `SubmissionInfoDto`
- [ ] **6.18** Update all imports across the codebase
- [ ] **6.19** Run `mvn clean test` — all tests pass

---

## Phase 7 — Extract Scoreboard Module / CQRS (~2h)

> **Goal:** Create the scoreboard module with CQRS read model — replaces the old `ScoreboardService`.  
> **Commit:** `modulith(phase-7): extract scoreboard module with CQRS`

- [ ] **7.1** Create scoreboard package structure: `scoreboard/{dto}` + `scoreboard/internal/{domain/{entities,ports},application/{query,listeners},infrastructure/persistence,presentation/{controllers,dto/response}}`
- [ ] **7.2** Create `scoreboard/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared"})`
- [ ] **7.3** Create `ScoreboardEntry` read model entity (new table: `scoreboard_entries`)
- [ ] **7.4** Create `ScoreboardReadRepository` (port + Spring Data adapter)
- [ ] **7.5** Create `ScoreboardProjection` — event listener handling `SubmissionGradedEvent`, `TeamScoreResetEvent`, `TeamRegisteredEvent`, `TeamRemovedEvent`
- [ ] **7.6** Implement `recalculateRanks(quizId)` in projection (sort by score → assign rank → detect ties)
- [ ] **7.7** Create `ScoreboardQueryService` (reads from denormalized `scoreboard_entries` table)
- [ ] **7.8** Migrate `ScoreboardController` to call `ScoreboardQueryService` instead of old `ScoreboardService`
- [ ] **7.9** Create `ScoreboardFacade.java` (public API: `getLeaderboard`)
- [ ] **7.10** Create public DTO: `ScoreboardEntryDto`
- [ ] **7.11** Delete old `ScoreboardService.java` (join-based implementation)
- [ ] **7.12** Run `mvn clean test`
- [ ] **7.13** Verify leaderboard endpoint: `curl http://localhost:8082/api/quiz/{quizId}/scoreboard`

---

## Phase 8 — Extract Backup Module (~1.5h)

> **Goal:** Create the backup module with saga-enabled restore (compensation on failure).  
> **Commit:** `modulith(phase-8): extract backup module with saga`

- [ ] **8.1** Create backup package structure: `backup/{events,dto}` + `backup/internal/{domain/{entities,ports},application/services,infrastructure/{persistence,executor,config},presentation/{controllers,dto}}`
- [ ] **8.2** Create `backup/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared"})`
- [ ] **8.3** Move `BackupRecord.java` → `backup/internal/domain/entities/`
- [ ] **8.4** Move `BackupRecordRepository` (clean port from Phase 0) → `backup/internal/domain/ports/`
- [ ] **8.5** Move `BackupService`, `BackupServiceImpl` → `backup/internal/application/services/`
- [ ] **8.6** Move `PostgresBackupExecutor`, `PostgresBackupExecutorImpl` → `backup/internal/infrastructure/executor/`
- [ ] **8.7** Move `BackupProperties`, `BackupDirectoryInitializer` → `backup/internal/infrastructure/config/`
- [ ] **8.8** Move persistence adapters → `backup/internal/infrastructure/persistence/`
- [ ] **8.9** Move `BackupController` → `backup/internal/presentation/controllers/`
- [ ] **8.10** Move related DTOs → `backup/internal/presentation/dto/`
- [ ] **8.11** Fix `BackupRecord` JPA: replace `@ManyToOne User createdBy` → `@Column Long createdByUserId`
- [ ] **8.12** Add saga to `restoreFromBackup()`: safety backup → try restore → catch + compensate (re-restore from safety)
- [ ] **8.13** Create event records: `BackupCreatedEvent`, `BackupRestoredEvent`
- [ ] **8.14** Add event publishing to `BackupServiceImpl`
- [ ] **8.15** Create `BackupFacade.java` (public API: `createBackup`, `restoreFromBackup`, `listBackups`)
- [ ] **8.16** Create public DTO: `BackupRecordDto`
- [ ] **8.17** Update all imports across the codebase
- [ ] **8.18** Run `mvn clean test` — all tests pass

---

## Phase 9 — Extract Realtime Module (~4h)

> **Goal:** Extract the realtime module — refactor `GameFlowService` from 8 deps to facade-based; add quiz activation saga.  
> **Commit:** `modulith(phase-9): extract realtime module with saga`

- [ ] **9.1** Create realtime package structure: `realtime/internal/{domain/enums,application/{services,listeners},infrastructure/config,presentation/{controllers,exception,dto}}`
- [ ] **9.2** Create `realtime/package-info.java` with `@ApplicationModule(allowedDependencies = {"shared", "quiz", "team", "submission", "scoreboard"})`
- [ ] **9.3** Move `GameFlowService`, `QuizTimerService`, `AnswerDistributionService`, `QuizBroadcastService`, `QuizSessionManager` → `realtime/internal/application/services/`
- [ ] **9.4** Move `GameState`, `HostCommandType` enums → `realtime/internal/domain/enums/`
- [ ] **9.5** Move `QuizWebSocketController` → `realtime/internal/presentation/controllers/`
- [ ] **9.6** Move `WebSocketExceptionHandler` → `realtime/internal/presentation/exception/`
- [ ] **9.7** Move all 12 WebSocket DTOs → `realtime/internal/presentation/dto/`
- [ ] **9.8** Move `WebSocketConfig`, `WebSocketAuthInterceptor`, `WebSocketEventListener` → `realtime/internal/infrastructure/config/`
- [ ] **9.9** Refactor `GameFlowService` constructor: remove 4 repository deps, add 3 facades (`QuizFacade`, `TeamFacade`, `SubmissionFacade`) + `ApplicationEventPublisher`
- [ ] **9.10** Rewrite `showQuestion()`: `quizRepository.findById()` → `quizFacade.getOrderedQuestions(quizId)`
- [ ] **9.11** Rewrite `calculateAndRevealResults()`: `questionRepository.findById()` → `quizFacade.getQuestionForGrading()`, `quiz.getTeams()` → `teamFacade.getTeamsByQuiz()`
- [ ] **9.12** Rewrite `handleSubmission()`: `teamRepository.findById()` → `teamFacade.getTeamInfo()`, `submissionRepository.save()` → `submissionFacade.submitAnswer()`
- [ ] **9.13** Rewrite `showRoundSummary()`: `quiz.getLeaderboard()` → `scoreboardFacade.getLeaderboard(quizId)`
- [ ] **9.14** Implement quiz activation saga in `activateQuiz()` with compensation (deactivate + clear session on failure)
- [ ] **9.15** Create `RealtimeEventListener` — handles `TeamRegisteredEvent`, `SubmissionGradedEvent`, `QuizSessionDeactivatedEvent`
- [ ] **9.16** Create `RealtimeFacade.java` (public API: `broadcastToQuiz`)
- [ ] **9.17** Update all imports across the codebase
- [ ] **9.18** Run `mvn clean test` — all tests pass

---

## Phase 10 — Validation & Finalization (~2h)

> **Goal:** Full module verification, cleanup empty packages, generate documentation, verify all 32 acceptance criteria.  
> **Commit:** `modulith(phase-10): validation complete — all 32 acceptance criteria met`

### Cleanup

- [ ] **10.1** Verify original packages are empty: `find src/main/java/com/intelliquiz/api/{domain,application,infrastructure,presentation} -name "*.java"`
- [ ] **10.2** Delete empty directories: `domain/`, `application/`, `infrastructure/`, `presentation/`
- [ ] **10.3** Remove scaffolding files: `auth/internal/.gitkeep`, empty `package-info.java` stubs

### Module Verification Tests

- [ ] **10.4** Create `ModuleStructureTest` with `ApplicationModules.of(...).verify()`
- [ ] **10.5** Add test: `shouldDetectAll9Modules()` — asserts all 9 module names
- [ ] **10.6** Add test: `shouldGenerateDocumentation()` — generates PlantUML files

### Per-Module Integration Tests

- [ ] **10.7** Create `@ApplicationModuleTest` for `auth` module
- [ ] **10.8** Create `@ApplicationModuleTest` for `quiz` module
- [ ] **10.9** Create `@ApplicationModuleTest` for `user` module
- [ ] **10.10** Create `@ApplicationModuleTest` for `team` module
- [ ] **10.11** Create `@ApplicationModuleTest` for `submission` module
- [ ] **10.12** Create `@ApplicationModuleTest` for `scoreboard` module (CQRS projection tests)
- [ ] **10.13** Create `@ApplicationModuleTest` for `backup` module
- [ ] **10.14** Create `@ApplicationModuleTest` for `realtime` module

### Event Publication Tests

- [ ] **10.15** Verify `QuizCreatedEvent` publication + consumption
- [ ] **10.16** Verify `SubmissionGradedEvent` → `ScoreboardProjection` flow
- [ ] **10.17** Verify `TeamRegisteredEvent` → scoreboard + realtime listeners
- [ ] **10.18** Verify `QuestionDeletedEvent` → submission cleanup listener
- [ ] **10.19** Verify `TeamRemovedEvent` → submission + scoreboard cleanup

### Full Verification

- [ ] **10.20** Run `mvn clean verify` — all tests pass (including new module tests)
- [ ] **10.21** Docker build: `docker-compose build` succeeds
- [ ] **10.22** Docker run: `docker-compose up -d` — app starts, API accessible at `localhost:8082`
- [ ] **10.23** Smoke test: `curl http://localhost:8082/api/quiz` returns 200
- [ ] **10.24** Docker cleanup: `docker-compose down`

### Acceptance Criteria Checklist (AC-1 through AC-32)

| Done | AC | Criteria | Verification |
|---|---|---|---|
| [ ] | AC-1 | `ApplicationModules.verify()` passes | `ModuleStructureTest` |
| [ ] | AC-2 | 9 modules detected | `shouldDetectAll9Modules()` |
| [ ] | AC-3 | No illegal cross-module access | `modules.verify()` |
| [ ] | AC-4 | All `internal/` types are encapsulated | `modules.verify()` |
| [ ] | AC-5 | Every module has `package-info.java` | `find src -name "package-info.java" \| wc -l` ≥ 9 |
| [ ] | AC-6 | All existing tests still pass | `mvn test` |
| [ ] | AC-7 | No existing test deleted | Git diff review |
| [ ] | AC-8 | One `@ApplicationModuleTest` per module | Test class count |
| [ ] | AC-9 | Event publication tests pass | Scenario API tests |
| [ ] | AC-10 | PlantUML documentation generated | `shouldGenerateDocumentation()` |
| [ ] | AC-11 | Docker image builds | `docker-compose build` |
| [ ] | AC-12 | Frontend API compatibility maintained | Manual/E2E test |
| [ ] | AC-13 | Module dependency graph is acyclic | `modules.verify()` |
| [ ] | AC-14 | `GameFlowService` has ≤ 4 facade deps (no repos) | Code review |
| [ ] | AC-15 | `BackupRecordRepository` doesn't extend `JpaRepository` | Code review |
| [ ] | AC-16 | Each module has 4 layers: presentation/application/domain/infrastructure | Package structure review |
| [ ] | AC-17 | Domain layer has zero Spring imports (except JPA) | `grep` check |
| [ ] | AC-18 | Repository ports are plain interfaces | Code review |
| [ ] | AC-19 | All cross-module entities reference by ID, not entity | `grep @ManyToOne` |
| [ ] | AC-20 | No `@OneToMany` crosses module boundaries | `grep @OneToMany` |
| [ ] | AC-21 | Events are published from application layer only | Code review |
| [ ] | AC-22 | All listeners use `@ApplicationModuleListener` | Code review |
| [ ] | AC-23 | Every module has a facade as its public API | Facade class exists per module |
| [ ] | AC-24 | Each module has an identified aggregate root | Code review |
| [ ] | AC-25 | Value objects are Java records with validation | AccessCode etc. |
| [ ] | AC-26 | Rich domain methods exist on entities | `Quiz.activate()` etc. |
| [ ] | AC-27 | Aggregate roots enforce invariants | Unit tests |
| [ ] | AC-28 | Scoreboard has separate read model entity | `ScoreboardEntry.java` exists |
| [ ] | AC-29 | `ScoreboardProjection` handles 4+ event types | Code review |
| [ ] | AC-30 | No direct write endpoint on scoreboard module | Controller review |
| [ ] | AC-31 | Quiz activation saga has compensation | `activateQuiz()` try/catch |
| [ ] | AC-32 | Ubiquitous language used across module names + events | Code review |

---

## Progress Summary

| Phase | Module | Status | Duration |
|---|---|---|---|
| 0 | Pre-cleanup | **Done** ✓ | ~2h |
| 1 | shared | **Done** ✓ | ~1h |
| 2 | auth | Not started | ~2h |
| 3 | quiz | Not started | ~3h |
| 4 | user | Not started | ~2h |
| 5 | team | Not started | ~1.5h |
| 6 | submission | Not started | ~2h |
| 7 | scoreboard (CQRS) | Not started | ~2h |
| 8 | backup (Saga) | Not started | ~1.5h |
| 9 | realtime (Saga) | Not started | ~4h |
| 10 | validation | Not started | ~2h |
| **Total** | | | **~23h** |
