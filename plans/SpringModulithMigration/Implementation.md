## 3. Implementation

This section provides a phase-by-phase, step-by-step implementation guide with exact file operations, code changes, and verification commands.

### 3.1 Phase 0 — Pre-Migration Cleanup

**Goal:** Fix the 5 architectural anti-patterns identified in [Section 1.2.5](#125-architectural-anti-patterns-to-fix) before moving any code.

**Duration:** ~2 hours

#### Step 0.1: Fix AP-1 — BackupRecordRepository Leaky Abstraction

The `BackupRecordRepository` in `domain.ports` currently extends `JpaRepository` directly. Create a clean port interface.

**Actions:**

1. **Create clean port interface** — Replace the current `BackupRecordRepository` content:

```java
// domain/ports/BackupRecordRepository.java (REWRITE)
package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.BackupRecord;
import java.util.List;
import java.util.Optional;

public interface BackupRecordRepository {
    BackupRecord save(BackupRecord record);
    Optional<BackupRecord> findById(Long id);
    List<BackupRecord> findAllByOrderByCreatedAtDesc();
    void delete(BackupRecord record);
}
```

2. **Create Spring Data JPA interface:**

```java
// infrastructure/adapters/persistence/spring/SpringBackupRecordRepository.java (NEW)
package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpringBackupRecordRepository extends JpaRepository<BackupRecord, Long> {
    List<BackupRecord> findAllByOrderByCreatedAtDesc();
}
```

3. **Create adapter implementation:**

```java
// infrastructure/adapters/persistence/impl/BackupRecordRepositoryImpl.java (NEW)
package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringBackupRecordRepository;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;

@Component
public class BackupRecordRepositoryImpl implements BackupRecordRepository {
    private final SpringBackupRecordRepository jpaRepo;

    public BackupRecordRepositoryImpl(SpringBackupRecordRepository jpaRepo) {
        this.jpaRepo = jpaRepo;
    }

    @Override public BackupRecord save(BackupRecord record) { return jpaRepo.save(record); }
    @Override public Optional<BackupRecord> findById(Long id) { return jpaRepo.findById(id); }
    @Override public List<BackupRecord> findAllByOrderByCreatedAtDesc() {
        return jpaRepo.findAllByOrderByCreatedAtDesc();
    }
    @Override public void delete(BackupRecord record) { jpaRepo.delete(record); }
}
```

4. **Update `BackupServiceImpl`** — change `backupRecordRepository.deleteById()` to use `findById()` + `delete()` since the port no longer exposes `deleteById`.

**Verify:** `mvn clean test`

#### Step 0.2: Fix AP-3 — Misplaced Services in Config Package

Move `QuizBroadcastService` and `QuizSessionManager` from `infrastructure.config` to `infrastructure.websocket`:

```bash
git mv src/main/java/com/intelliquiz/api/infrastructure/config/QuizBroadcastService.java \
       src/main/java/com/intelliquiz/api/infrastructure/websocket/QuizBroadcastService.java

git mv src/main/java/com/intelliquiz/api/infrastructure/config/QuizSessionManager.java \
       src/main/java/com/intelliquiz/api/infrastructure/websocket/QuizSessionManager.java
```

Update the `package` declaration in both files, and update all `import` statements across the codebase (primarily in `GameFlowService`, `QuizWebSocketController`, and `WebSocketEventListener`).

**Verify:** `mvn clean test`

#### Step 0.3: Fix AP-5 — @Service on Domain Service

`CodeGenerationService` has `@Service` in the domain layer. For now, leave it as-is — it will be moved to the `shared` module in Phase 1 where `@Service` is acceptable.

**Verify:** All 40+ tests pass after Phase 0 changes.

---

### 3.2 Phase 1 — Extract Shared Module

**Goal:** Create the `shared` module containing all cross-cutting types.

**Duration:** ~1 hour

#### Step 1.1: Create shared module package structure

```bash
mkdir -p src/main/java/com/intelliquiz/api/shared/{exceptions,enums,services,dto,exception}
```

#### Step 1.2: Create `package-info.java`

```java
// com/intelliquiz/api/shared/package-info.java
@org.springframework.modulith.ApplicationModule(
    displayName = "Shared",
    type = org.springframework.modulith.ApplicationModule.Type.OPEN
)
package com.intelliquiz.api.shared;
```

> **Note:** `Type.OPEN` means all types are public. Shared has no `internal/` package.

#### Step 1.3: Move files

| Source | Destination |
|---|---|
| `domain/exceptions/*.java` (all 11) | `shared/exceptions/` |
| `domain/enums/*.java` (all 6) | `shared/enums/` |
| `application/services/RouteType.java` | `shared/enums/` |
| `domain/services/CodeGenerationService.java` | `shared/services/` |
| `presentation/dto/BackupRecordDTO.java` | `shared/dto/` (or keep in backup module later) |
| `presentation/exception/GlobalExceptionHandler.java` | `shared/exception/` |
| — | `shared/dto/ErrorResponse.java` (extract from GlobalExceptionHandler) |

After each file move:
1. Update `package` declaration
2. Run: `grep -r "old.import.path" src/` to find all affected imports
3. Update all import statements

#### Step 1.4: Verify

```bash
mvn clean test
```

All tests should pass. No module verification test yet (only 1 module exists).

**Commit:** `modulith(phase-1): extract shared module`

---

### 3.3 Phase 2 — Extract Auth Module

**Goal:** Create the `auth` module with JWT, security config, and authentication/authorization services.

**Duration:** ~2 hours

#### Step 2.1: Create auth module package structure

```bash
mkdir -p src/main/java/com/intelliquiz/api/auth/{events,dto}
mkdir -p src/main/java/com/intelliquiz/api/auth/internal/{domain/ports,application/services,infrastructure/{security,config},presentation/{controllers,dto/{request,response}}}
```

#### Step 2.2: Create `package-info.java`

```java
@org.springframework.modulith.ApplicationModule(
    displayName = "Auth",
    allowedDependencies = {"shared", "user"}
)
package com.intelliquiz.api.auth;
```

> **Note:** Auth depends on `user` because `AuthenticationService` needs to look up user credentials. During Phase 2, `user` module doesn't exist yet, so temporarily set `allowedDependencies = {"shared"}` and use direct `UserRepository` access. Update to facade in Phase 4.

#### Step 2.3: Move files

| Source | Destination |
|---|---|
| `application/services/AuthenticationService.java` | `auth/internal/application/services/` |
| `application/services/AuthorizationService.java` | `auth/internal/application/services/` |
| `application/services/AccessResolutionService.java` | `auth/internal/application/services/` |
| `application/services/AuthenticationResult.java` | `auth/internal/application/services/` |
| `application/services/AccessResolutionResult.java` | `auth/internal/application/services/` |
| `domain/ports/PasswordHashingService.java` | `auth/internal/domain/ports/` |
| `infrastructure/adapters/security/BCryptPasswordHashingService.java` | `auth/internal/infrastructure/security/` |
| `infrastructure/config/JwtConfig.java` | `auth/internal/infrastructure/config/` |
| `infrastructure/config/JwtAuthenticationFilter.java` | `auth/internal/infrastructure/config/` |
| `infrastructure/config/SecurityConfig.java` | `auth/internal/infrastructure/config/` |
| `infrastructure/config/CorsConfig.java` | `auth/internal/infrastructure/config/` |
| `infrastructure/config/OpenApiConfig.java` | `auth/internal/infrastructure/config/` |
| `presentation/controllers/AuthController.java` | `auth/internal/presentation/controllers/` |
| `presentation/controllers/AccessController.java` | `auth/internal/presentation/controllers/` |
| Related request/response DTOs | `auth/internal/presentation/dto/request/` and `response/` |

#### Step 2.4: Create AuthFacade

```java
// com/intelliquiz/api/auth/AuthFacade.java
@Service
public class AuthFacade {
    // ... as designed in Section 2.2.2
}
```

#### Step 2.5: Create public DTOs

```java
// com/intelliquiz/api/auth/dto/AuthenticationResultDto.java
// com/intelliquiz/api/auth/dto/AccessResolutionResultDto.java
```

#### Step 2.6: Update all imports across the codebase

Run a global search-replace for moved classes. Key patterns:
```bash
# Find all files that import from old paths
grep -r "com.intelliquiz.api.application.services.Authentication" src/ --include="*.java"
grep -r "com.intelliquiz.api.infrastructure.config.Jwt" src/ --include="*.java"
grep -r "com.intelliquiz.api.infrastructure.config.Security" src/ --include="*.java"
```

#### Step 2.7: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-2): extract auth module`

---

### 3.4 Phase 3 — Extract Quiz Module

**Goal:** Create the `quiz` module with Quiz/Question entities, CRUD services, session management, events.

**Duration:** ~3 hours (most complex entity — aggregate root with child entity)

#### Step 3.1: Create quiz module structure

```bash
mkdir -p src/main/java/com/intelliquiz/api/quiz/{events,dto}
mkdir -p src/main/java/com/intelliquiz/api/quiz/internal/{domain/{entities,valueobjects,ports},application/{services,commands},infrastructure/persistence,presentation/{controllers,dto/{request,response}}}
```

#### Step 3.2: Create package-info.java

```java
@org.springframework.modulith.ApplicationModule(
    displayName = "Quiz",
    allowedDependencies = {"shared", "auth"}
)
package com.intelliquiz.api.quiz;
```

#### Step 3.3: Move files

| Source | Destination |
|---|---|
| `domain/entities/Quiz.java` | `quiz/internal/domain/entities/` |
| `domain/entities/Question.java` | `quiz/internal/domain/entities/` |
| `domain/ports/QuizRepository.java` | `quiz/internal/domain/ports/` |
| `domain/ports/QuestionRepository.java` | `quiz/internal/domain/ports/` |
| `application/services/QuizManagementService.java` | `quiz/internal/application/services/` |
| `application/services/QuestionManagementService.java` | `quiz/internal/application/services/` |
| `application/services/QuizSessionService.java` | `quiz/internal/application/services/` |
| `application/commands/CreateQuiz*.java`, `UpdateQuiz*.java` | `quiz/internal/application/commands/` |
| `application/commands/CreateQuestion*.java`, `UpdateQuestion*.java` | `quiz/internal/application/commands/` |
| Persistence adapters (`QuizRepositoryImpl`, `SpringQuizRepository`, etc.) | `quiz/internal/infrastructure/persistence/` |
| `presentation/controllers/QuizController.java` | `quiz/internal/presentation/controllers/` |
| `presentation/controllers/QuestionController.java` | `quiz/internal/presentation/controllers/` |
| Related request/response DTOs | `quiz/internal/presentation/dto/` |

#### Step 3.4: Create event records

```java
// com/intelliquiz/api/quiz/events/
public record QuizCreatedEvent(Long quizId, String title, Instant occurredAt) {}
public record QuizStatusChangedEvent(Long quizId, QuizStatus oldStatus,
                                      QuizStatus newStatus, Instant occurredAt) {}
public record QuizSessionActivatedEvent(Long quizId, Instant occurredAt) {}
public record QuizSessionDeactivatedEvent(Long quizId, Instant occurredAt) {}
public record QuestionAddedEvent(Long questionId, Long quizId, Instant occurredAt) {}
public record QuestionDeletedEvent(Long questionId, Long quizId, Instant occurredAt) {}
```

#### Step 3.5: Add event publishing to services

```java
// In QuizManagementService
@Service
public class QuizManagementService {
    private final ApplicationEventPublisher eventPublisher;

    public Quiz createQuiz(CreateQuizCommand command) {
        // ... existing logic ...
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizCreatedEvent(
                saved.getId(), saved.getTitle(), Instant.now()));
        return saved;
    }

    public Quiz transitionToReady(Long quizId) {
        Quiz quiz = /* ... existing ... */;
        QuizStatus oldStatus = quiz.getStatus();
        quiz.transitionToReady();
        Quiz saved = quizRepository.save(quiz);
        eventPublisher.publishEvent(new QuizStatusChangedEvent(
                saved.getId(), oldStatus, saved.getStatus(), Instant.now()));
        return saved;
    }
}
```

#### Step 3.6: Create QuizFacade

As designed in [Section 2.2.3](#223-quiz-module-design).

#### Step 3.7: Remove cross-module navigable collections from Quiz entity

```java
// REMOVE from Quiz.java:
// @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
// @JsonManagedReference("quiz-teams")
// private List<Team> teams = new ArrayList<>();

// @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
// @JsonManagedReference("quiz-assignments")
// private List<QuizAssignment> assignments = new ArrayList<>();

// KEEP (same aggregate):
@OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
@JsonManagedReference("quiz-questions")
private List<Question> questions = new ArrayList<>();
```

Also remove the `getLeaderboard()` method from `Quiz` — scoreboard is now a separate module.

#### Step 3.8: Create QuizSession value object

```java
// com/intelliquiz/api/quiz/internal/domain/valueobjects/QuizSession.java
public record QuizSession(boolean isLive, String accessCode, String proctorPin) {
    public QuizSession {
        Objects.requireNonNull(proctorPin, "Proctor PIN required");
    }
}
```

#### Step 3.9: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-3): extract quiz module`

---

### 3.5 Phase 4 — Extract User Module

**Goal:** Create the `user` module with User/QuizAssignment entities.

**Duration:** ~2 hours

#### Step 4.1: Create user module structure + move files

Same pattern as Phase 3. Key moves:

| Source | Destination |
|---|---|
| `domain/entities/User.java` | `user/internal/domain/entities/` |
| `domain/entities/QuizAssignment.java` | `user/internal/domain/entities/` |
| `domain/ports/UserRepository.java` | `user/internal/domain/ports/` |
| `domain/ports/QuizAssignmentRepository.java` | `user/internal/domain/ports/` |
| `application/services/UserManagementService.java` | `user/internal/application/services/` |
| `application/commands/CreateUserCommand.java`, `UpdateUserCommand.java` | `user/internal/application/commands/` |
| Persistence adapters | `user/internal/infrastructure/persistence/` |
| `presentation/controllers/UserController.java` | `user/internal/presentation/controllers/` |
| Related DTOs | `user/internal/presentation/dto/` |

#### Step 4.2: Fix QuizAssignment JPA — replace `@ManyToOne Quiz` with `Long quizId`

```java
// BEFORE:
@ManyToOne
@JoinColumn(name = "quiz_id", nullable = false)
private Quiz quiz;

// AFTER:
@Column(name = "quiz_id", nullable = false)
private Long quizId;
```

Update `UserManagementService.assignQuizPermissions()` to use `QuizFacade.quizExists(quizId)` instead of `QuizRepository.findById()`.

#### Step 4.3: Add event publishing

```java
// In UserManagementService
public User createAdmin(CreateUserCommand command) {
    User saved = /* ... existing logic ... */;
    eventPublisher.publishEvent(new UserCreatedEvent(
            saved.getId(), saved.getUsername(), saved.getSystemRole(), Instant.now()));
    return saved;
}

public QuizAssignment assignQuizPermissions(Long userId, Long quizId, Set<AdminPermission> permissions) {
    // Validate quiz exists via facade
    if (!quizFacade.quizExists(quizId)) {
        throw new EntityNotFoundException("Quiz", quizId);
    }
    // ... existing logic ...
    eventPublisher.publishEvent(new PermissionsAssignedEvent(
            userId, quizId, permissions, Instant.now()));
    return assignment;
}
```

#### Step 4.4: Update auth module to use UserFacade

Now that the user module exists, update `AuthenticationService` to use `UserFacade` instead of `UserRepository` directly.

#### Step 4.5: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-4): extract user module`

---

### 3.6 Phase 5 — Extract Team Module

**Goal:** Create the `team` module.

**Duration:** ~1.5 hours

#### Step 5.1: Create team module structure + move files

Move `Team.java`, `TeamRepository.java`, `TeamRegistrationService.java`, adapters, controller, DTOs.

#### Step 5.2: Fix Team JPA — replace entity references with IDs

```java
// Team.java — BEFORE:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "quiz_id", nullable = false)
private Quiz quiz;

// Team.java — AFTER:
@Column(name = "quiz_id", nullable = false)
private Long quizId;
```

Remove `getQuiz()`, `setQuiz()`. Add `getQuizId()`, `setQuizId()`. Remove `submissions` collection entirely.

#### Step 5.3: Update TeamRegistrationService

Replace `QuizRepository` dependency with `QuizFacade`:

```java
public Team registerTeam(Long quizId, String teamName) {
    if (!quizFacade.quizExists(quizId)) {
        throw new EntityNotFoundException("Quiz", quizId);
    }
    String accessCode = generateUniqueAccessCode();
    Team team = new Team(quizId, teamName, accessCode);
    Team saved = teamRepository.save(team);
    eventPublisher.publishEvent(new TeamRegisteredEvent(
            saved.getId(), quizId, teamName, Instant.now()));
    return saved;
}
```

#### Step 5.4: Update TeamRepository port

Remove `findByQuiz(Quiz quiz)` — replace with `findByQuizId(Long quizId)`.

#### Step 5.5: Create AccessCode value object

```java
// com/intelliquiz/api/team/internal/domain/valueobjects/AccessCode.java
public record AccessCode(String value) {
    private static final Pattern VALID = Pattern.compile("^[A-Z0-9]{6}$");
    public AccessCode {
        Objects.requireNonNull(value);
        if (!VALID.matcher(value).matches()) {
            throw new InvalidAccessCodeException("Invalid format: " + value);
        }
    }
}
```

#### Step 5.6: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-5): extract team module`

---

### 3.7 Phase 6 — Extract Submission Module

**Goal:** Create the `submission` module with event publishing and consumption.

**Duration:** ~2 hours

#### Step 6.1: Move files + create structure

Move `Submission.java`, `SubmissionRepository.java`, `SubmissionService.java`, adapters, controller, DTOs.

#### Step 6.2: Fix Submission JPA — replace entity references with IDs

```java
// BEFORE:
@ManyToOne private Team team;
@ManyToOne private Question question;

// AFTER:
@Column(name = "team_id", nullable = false) private Long teamId;
@Column(name = "question_id", nullable = false) private Long questionId;
```

#### Step 6.3: Update SubmissionService

Replace `TeamRepository`/`QuestionRepository` with facades:

```java
public Submission submitAnswerWithGrading(Long teamId, Long questionId, String answer) {
    // Validate via facades
    TeamInfoDto team = teamFacade.getTeamInfo(teamId);    // throws if not found
    QuestionInfoDto question = quizFacade.getQuestionForGrading(questionId);

    // Check duplicate
    if (submissionRepository.findByTeamIdAndQuestionId(teamId, questionId).isPresent()) {
        throw new DuplicateSubmissionException("Team already submitted");
    }

    // Create, grade, save
    Submission submission = new Submission(teamId, questionId, answer);
    boolean isCorrect = question.correctKey().equalsIgnoreCase(answer.trim());
    submission.grade(isCorrect, isCorrect ? question.points() : 0);
    Submission saved = submissionRepository.save(submission);

    // Publish event
    eventPublisher.publishEvent(new SubmissionGradedEvent(
            saved.getId(), teamId, questionId, team.quizId(),
            saved.getAwardedPoints(), isCorrect, Instant.now()));

    return saved;
}
```

#### Step 6.4: Create event listener for cleanup

```java
@Component
public class SubmissionEventListener {
    private final SubmissionRepository submissionRepository;

    @ApplicationModuleListener
    public void on(QuestionDeletedEvent event) {
        submissionRepository.deleteByQuestionId(event.questionId());
    }

    @ApplicationModuleListener
    public void on(TeamRemovedEvent event) {
        submissionRepository.deleteByTeamId(event.teamId());
    }
}
```

#### Step 6.5: Update SubmissionRepository port

```java
public interface SubmissionRepository {
    Submission save(Submission submission);
    Optional<Submission> findById(Long id);
    Optional<Submission> findByTeamIdAndQuestionId(Long teamId, Long questionId);
    List<Submission> findByTeamId(Long teamId);
    List<Submission> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
    void deleteByTeamId(Long teamId);
}
```

#### Step 6.6: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-6): extract submission module`

---

### 3.8 Phase 7 — Extract Scoreboard Module (CQRS)

**Goal:** Create the scoreboard module with CQRS read model.

**Duration:** ~2 hours

#### Step 7.1: Create module structure

```bash
mkdir -p src/main/java/com/intelliquiz/api/scoreboard/{dto}
mkdir -p src/main/java/com/intelliquiz/api/scoreboard/internal/{domain/{entities,ports},application/{query,listeners},infrastructure/persistence,presentation/{controllers,dto/response}}
```

#### Step 7.2: Create ScoreboardEntry read model entity

As designed in [Section 2.2.7](#227-scoreboard-module-design-cqrs). This is a **new entity** — it doesn't exist in the current codebase.

#### Step 7.3: Create ScoreboardProjection event listener

As designed in Section 2.2.7. Handles `SubmissionGradedEvent`, `TeamScoreResetEvent`, `TeamRegisteredEvent`, `TeamRemovedEvent`.

#### Step 7.4: Create ScoreboardQueryService

Simple service that reads from `ScoreboardReadRepository.findByQuizIdOrderByRankAsc(quizId)`.

#### Step 7.5: Create ScoreboardController

Migrates from current `ScoreboardController` which calls `ScoreboardService` → now calls `ScoreboardQueryService` (reads from denormalized table).

#### Step 7.6: Delete old ScoreboardService

The old `ScoreboardService` (which joins Quiz + Team for every request) is replaced by the CQRS read model. Delete the old class after confirming the new controller works.

#### Step 7.7: Verify

```bash
mvn clean test
# Also verify leaderboard API returns correct data
curl http://localhost:8082/api/quiz/{quizId}/scoreboard
```

**Commit:** `modulith(phase-7): extract scoreboard module with CQRS`

---

### 3.9 Phase 8 — Extract Backup Module

**Goal:** Create the backup module with saga-enabled restore.

**Duration:** ~1.5 hours

#### Step 8.1: Move files

Move `BackupRecord.java`, `BackupRecordRepository.java` (clean port from Phase 0), `BackupService.java`, `BackupServiceImpl.java`, `PostgresBackupExecutor.java`, `PostgresBackupExecutorImpl.java`, `BackupProperties.java`, `BackupDirectoryInitializer.java`, `BackupController.java`, related DTOs.

#### Step 8.2: Fix BackupRecord JPA — replace User entity reference

```java
// BEFORE:
@ManyToOne
@JoinColumn(name = "created_by_user_id")
private User createdBy;

// AFTER:
@Column(name = "created_by_user_id")
private Long createdByUserId;
```

#### Step 8.3: Add saga to restoreFromBackup

Enhance `BackupServiceImpl.restoreFromBackup()` with try/catch compensation as designed in [Section 2.2.8](#228-backup-module-design-saga).

#### Step 8.4: Add event publishing

```java
eventPublisher.publishEvent(new BackupCreatedEvent(saved.getId(), saved.getFilename(), Instant.now()));
eventPublisher.publishEvent(new BackupRestoredEvent(record.getId(), record.getFilename(), Instant.now()));
```

#### Step 8.5: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-8): extract backup module with saga`

---

### 3.10 Phase 9 — Extract Realtime Module

**Goal:** Create the realtime module — the most complex extraction due to `GameFlowService`'s extensive dependencies.

**Duration:** ~4 hours

#### Step 9.1: Create module structure

```bash
mkdir -p src/main/java/com/intelliquiz/api/realtime
mkdir -p src/main/java/com/intelliquiz/api/realtime/internal/{domain/enums,application/{services,listeners},infrastructure/config,presentation/{controllers,exception,dto}}
```

#### Step 9.2: Move files

| Source | Destination |
|---|---|
| `infrastructure/websocket/GameFlowService.java` | `realtime/internal/application/services/` |
| `infrastructure/websocket/QuizTimerService.java` | `realtime/internal/application/services/` |
| `infrastructure/websocket/AnswerDistributionService.java` | `realtime/internal/application/services/` |
| `infrastructure/websocket/QuizBroadcastService.java` | `realtime/internal/application/services/` |
| `infrastructure/websocket/QuizSessionManager.java` | `realtime/internal/application/services/` |
| `infrastructure/websocket/GameState.java` | `realtime/internal/domain/enums/` |
| `infrastructure/websocket/HostCommandType.java` | `realtime/internal/domain/enums/` |
| `infrastructure/websocket/QuizWebSocketController.java` | `realtime/internal/presentation/controllers/` |
| `infrastructure/websocket/WebSocketExceptionHandler.java` | `realtime/internal/presentation/exception/` |
| `infrastructure/websocket/dto/*.java` (all 12) | `realtime/internal/presentation/dto/` |
| `infrastructure/config/WebSocketConfig.java` | `realtime/internal/infrastructure/config/` |
| `infrastructure/config/WebSocketAuthInterceptor.java` | `realtime/internal/infrastructure/config/` |
| `infrastructure/config/WebSocketEventListener.java` | `realtime/internal/infrastructure/config/` |

#### Step 9.3: Refactor GameFlowService — replace 4 repositories with 3 facades

This is the **critical refactoring step**:

```java
// BEFORE (8 dependencies, 4 are repositories):
public GameFlowService(
    QuizTimerService timerService,
    QuizBroadcastService broadcastService,
    QuizSessionManager sessionManager,
    QuizRepository quizRepository,           // ← REMOVE
    QuestionRepository questionRepository,   // ← REMOVE
    TeamRepository teamRepository,           // ← REMOVE
    SubmissionRepository submissionRepository,// ← REMOVE
    AnswerDistributionService distributionService
)

// AFTER (7 dependencies, 3 are facades):
public GameFlowService(
    QuizTimerService timerService,
    QuizBroadcastService broadcastService,
    QuizSessionManager sessionManager,
    AnswerDistributionService distributionService,
    QuizFacade quizFacade,                   // ← NEW
    TeamFacade teamFacade,                   // ← NEW
    SubmissionFacade submissionFacade,        // ← NEW
    ApplicationEventPublisher eventPublisher  // ← NEW (for saga events)
)
```

**Key method rewrites:**

- `showQuestion()`: Replace `quizRepository.findById()` → `quizFacade.getOrderedQuestions(quizId)`
- `calculateAndRevealResults()`: Replace `questionRepository.findById()` → `quizFacade.getQuestionForGrading(questionId)`, replace `quiz.getTeams()` → `teamFacade.getTeamsByQuiz(quizId)`
- `handleSubmission()`: Replace `teamRepository.findById()` → `teamFacade.getTeamInfo(teamId)`, replace `submissionRepository.save()` → `submissionFacade.submitAnswer()`
- `showRoundSummary()`: Replace `quiz.getLeaderboard()` → `scoreboardFacade.getLeaderboard(quizId)` (or `teamFacade.getTeamsByQuiz()` sorted by score)

#### Step 9.4: Add quiz activation saga

Add the saga pattern to `activateQuiz()` as designed in [Section 2.2.9](#229-realtime-module-design-saga--event-consumer).

#### Step 9.5: Create RealtimeEventListener

```java
@Component
public class RealtimeEventListener {
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;

    @ApplicationModuleListener
    public void on(TeamRegisteredEvent event) { /* broadcast team joined */ }

    @ApplicationModuleListener
    public void on(SubmissionGradedEvent event) { /* notify host */ }

    @ApplicationModuleListener
    public void on(QuizSessionDeactivatedEvent event) { /* cleanup session */ }
}
```

#### Step 9.6: Verify

```bash
mvn clean test
```

**Commit:** `modulith(phase-9): extract realtime module with saga`

---

### 3.11 Phase 10 — Validation & Finalization

**Goal:** Full module verification, cleanup of any remaining old packages, documentation generation.

**Duration:** ~2 hours

#### Step 10.1: Clean up empty source packages

After all phases, the original `domain/`, `application/`, `infrastructure/`, and `presentation/` packages should be empty. Remove them:

```bash
# Verify they're empty
find src/main/java/com/intelliquiz/api/{domain,application,infrastructure,presentation} -name "*.java" | head

# Remove empty directories
rm -rf src/main/java/com/intelliquiz/api/domain
rm -rf src/main/java/com/intelliquiz/api/application
rm -rf src/main/java/com/intelliquiz/api/infrastructure
rm -rf src/main/java/com/intelliquiz/api/presentation
rm -rf src/main/java/com/intelliquiz/api/auth/internal/.gitkeep
```

#### Step 10.2: Create ModuleStructureTest

```java
@SpringBootTest
class ModuleStructureTest {

    @Test
    void shouldVerifyModularStructure() {
        ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
        modules.verify();
    }

    @Test
    void shouldDetectAll9Modules() {
        ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
        assertThat(modules.stream().map(m -> m.getName()).toList())
                .containsExactlyInAnyOrder(
                    "shared", "auth", "user", "quiz", "team",
                    "submission", "scoreboard", "backup", "realtime"
                );
    }

    @Test
    void shouldGenerateDocumentation() {
        ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
        new Documenter(modules)
            .writeModulesAsPlantUml()
            .writeIndividualModulesAsPlantUml();
    }
}
```

#### Step 10.3: Run per-module integration tests

Create `@ApplicationModuleTest` for each module as specified in [TR-2](#tr-2-per-module-integration-tests).

#### Step 10.4: Run event publication tests

For each event in [EV-1](#ev-1-required-application-events), verify publication + consumption using Spring Modulith's `Scenario` API.

#### Step 10.5: Full verification

```bash
# Build + all tests
mvn clean verify

# Docker build
docker-compose build
docker-compose up -d
# Verify application starts and API is accessible
curl http://localhost:8082/api/quiz
docker-compose down
```

#### Step 10.6: Acceptance Criteria Verification

Walk through all 32 acceptance criteria (AC-1 through AC-32) and verify each one:

| AC | How to Verify |
|---|---|
| AC-1 | `ModuleStructureTest.shouldVerifyModularStructure()` passes |
| AC-2 | `ModuleStructureTest.shouldDetectAll9Modules()` passes |
| AC-3–4 | Covered by `modules.verify()` |
| AC-5 | `find src -name "package-info.java" | wc -l` returns ≥ 9 |
| AC-6–7 | `mvn test` passes all 40+ tests |
| AC-8 | One `@ApplicationModuleTest` per module exists |
| AC-9 | Event publication tests all pass |
| AC-10 | `shouldGenerateDocumentation()` generates PlantUML files |
| AC-11–12 | Docker build + frontend works |
| AC-13 | Covered by `modules.verify()` |
| AC-14 | `GameFlowService` constructor has ≤ 4 facade deps |
| AC-15 | `BackupRecordRepository` is a clean interface |
| AC-16–23 | Package structure review + ArchUnit tests |
| AC-24–32 | DDD/CQRS/Saga specific checks |

**Commit:** `modulith(phase-10): validation complete — all 32 acceptance criteria met`

---

### 3.12 Migration Timeline Summary

| Phase | Module | Duration | Key Risk | Dependencies |
|---|---|---|---|---|
| 0 | Pre-cleanup | ~2h | None | — |
| 1 | shared | ~1h | Import breakage across 100+ files | — |
| 2 | auth | ~2h | Security filter chain scope | Phase 1 |
| 3 | quiz | ~3h | `Quiz.teams` and `Quiz.assignments` removal | Phase 1 |
| 4 | user | ~2h | `QuizAssignment.quiz` → `Long quizId` | Phase 2, 3 |
| 5 | team | ~1.5h | `Team.quiz` → `Long quizId` | Phase 3 |
| 6 | submission | ~2h | 3-way JPA decoupling (Team ↔ Question ↔ Submission) | Phase 3, 5 |
| 7 | scoreboard | ~2h | CQRS projection correctness, data migration | Phase 5, 6 |
| 8 | backup | ~1.5h | Saga compensation (restore failure recovery) | Phase 1, 2 |
| 9 | realtime | ~4h | GameFlowService 8-dep refactoring + saga | Phase 3, 5, 6 |
| 10 | validation | ~2h | Module verification failures | All phases |
| **Total** | | **~23h** | | |

> **Pragmatic estimate:** 23 hours of focused development, split across ~2 weeks of work alongside other tasks. Each phase produces a deployable build, so progress is incremental and reversible.
