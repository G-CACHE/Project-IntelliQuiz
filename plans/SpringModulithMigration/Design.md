## 2. Design

This section translates the requirements from Section 1 into concrete technical designs — class diagrams, event flows, API contracts, database changes, and architectural decisions with code examples.

### 2.1 Target Architecture Overview

#### 2.1.1 High-Level Module Topology

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        IntelliQuizApiApplication                             │
│                        (com.intelliquiz.api)                                 │
│                        @SpringBootApplication                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                     SHARED MODULE (Foundation)                        │    │
│  │   Exceptions │ Enums │ CodeGenerationService │ GlobalExceptionHandler │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│       ▲          ▲          ▲          ▲          ▲          ▲          ▲    │
│       │          │          │          │          │          │          │    │
│  ┌────┴───┐ ┌────┴───┐ ┌───┴────┐ ┌───┴───┐ ┌───┴──────┐ ┌┴───────┐ ┌┴──┐│
│  │  AUTH  │ │  QUIZ  │ │  USER  │ │ TEAM  │ │SUBMISSION│ │ BACKUP │ │RT ││
│  │        │ │        │ │        │ │       │ │          │ │        │ │   ││
│  │ Login  │ │ CRUD   │ │ Admin  │ │ Reg   │ │ Answer   │ │pg_dump │ │WS ││
│  │ JWT    │ │ State  │ │ Perms  │ │ Code  │ │ Grade    │ │restore │ │GF ││
│  │ AuthZ  │ │ Session│ │ Assign │ │       │ │          │ │        │ │   ││
│  └────────┘ └────┬───┘ └────┬───┘ └───┬───┘ └────┬─────┘ └────────┘ └┬──┘│
│                  │          │         │          │                    │    │
│  ┌───────────────┴──────────┴─────────┴──────────┴────────────────────┴──┐ │
│  │                    SCOREBOARD MODULE (CQRS Read Side)                  │ │
│  │         ScoreboardEntry (denormalized) + ScoreboardProjection         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ════════════════════ Spring Modulith Event Bus ═════════════════════════    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Legend:**
- RT = Realtime module, WS = WebSocket, GF = GameFlowService
- Arrows (▲) represent `allowedDependencies` on the `shared` module
- The Event Bus connects all modules asynchronously

#### 2.1.2 Module Dependency Graph (Directed, Acyclic)

```
                    ┌──────────┐
                    │  shared  │
                    └────┬─────┘
           ┌─────────┬──┴──┬──────────┬──────────┐
           ▼         ▼     ▼          ▼          ▼
      ┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐
      │  auth  │ │ quiz │ │ backup │ │  team  │ │  user  │
      └────┬───┘ └──┬───┘ └────────┘ └───┬────┘ └───┬────┘
           │        │                    │          │
           │        │    ┌───────────────┘          │
           │        │    │                          │
           │        ▼    ▼                          │
           │   ┌────────────┐                       │
           │   │ submission │                       │
           │   └─────┬──────┘                       │
           │         │                              │
           │         ▼                              │
           │   ┌─────────────┐                      │
           │   │ scoreboard  │                      │
           │   └─────────────┘                      │
           │                                        │
           ▼                                        │
      ┌───────────┐                                 │
      │ realtime  │◄────────────────────────────────┘
      └───────────┘     (realtime depends on quiz, team, submission)
```

#### 2.1.3 Intra-Module Architecture (4-Layer Clean Architecture)

Every business module (except `shared`) follows this internal design:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODULE BOUNDARY                               │
│                                                                      │
│  PUBLIC API:  <Module>Facade.java  │  events/*.java  │  dto/*.java  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  internal/                                                     │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ PRESENTATION                                             │  │   │
│  │  │  Controller ──────────────────────────────┐              │  │   │
│  │  │  RequestDTO / ResponseDTO                  │              │  │   │
│  │  └────────────────────────────────────────────┼──────────┘  │   │
│  │                                               │              │   │
│  │  ┌────────────────────────────────────────────▼──────────┐  │   │
│  │  │ APPLICATION                                            │  │   │
│  │  │  Service ───► publishes Event ──► EventBus             │  │   │
│  │  │  Command records                                       │  │   │
│  │  │  Listener ◄── receives Event ◄── EventBus             │  │   │
│  │  └────────────────────────────────────────────┬──────────┘  │   │
│  │                                               │              │   │
│  │  ┌────────────────────────────────────────────▼──────────┐  │   │
│  │  │ DOMAIN (pure Java + JPA annotations)                   │  │   │
│  │  │  Aggregate Root (entity)  │  Value Object (record)     │  │   │
│  │  │  Repository Port (interface)  │  Domain Service        │  │   │
│  │  └────────────────────────────────────────────┬──────────┘  │   │
│  │                                               │              │   │
│  │  ┌────────────────────────────────────────────▼──────────┐  │   │
│  │  │ INFRASTRUCTURE                                         │  │   │
│  │  │  RepositoryImpl (implements port)  │  SpringRepository │  │   │
│  │  │  Config beans  │  External adapters                    │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Design

This section details the Facade API, event contracts, and key class designs for each module.

#### 2.2.1 Shared Module Design

**No facade** — only shared types consumed by other modules.

```java
// package-info.java
@org.springframework.modulith.ApplicationModule(
    displayName = "Shared",
    allowedDependencies = {}
)
package com.intelliquiz.api.shared;
```

**Key classes (flat structure):**

| Class | Type | Purpose |
|---|---|---|
| `DomainException` | Abstract class | Base for all domain exceptions |
| `EntityNotFoundException` | Exception | Standard 404 pattern |
| `CodeGenerationService` | `@Service` | Generates access codes + proctor PINs |
| `GlobalExceptionHandler` | `@RestControllerAdvice` | Maps exceptions → HTTP responses |
| `ErrorResponse` | Record | Standard error response body |
| All enums | Enum | `SystemRole`, `AdminPermission`, `QuizStatus`, `QuestionType`, `Difficulty`, `BackupStatus` |

#### 2.2.2 Auth Module Design

**Facade API:**

```java
@Service
public class AuthFacade {

    private final AuthenticationService authenticationService;
    private final AuthorizationService authorizationService;
    private final AccessResolutionService accessResolutionService;

    /** Authenticate user credentials, return JWT token + role */
    public AuthenticationResultDto authenticate(String username, String password) {
        AuthenticationResult result = authenticationService.authenticate(username, password);
        return new AuthenticationResultDto(result.token(), result.role().name());
    }

    /** Check if a user has a specific permission for a quiz */
    public boolean hasPermission(Long userId, Long quizId, AdminPermission permission) {
        return authorizationService.hasPermission(userId, quizId, permission);
    }

    /** Resolve access code → quiz ID + team ID for participants */
    public AccessResolutionResultDto resolveAccessCode(String accessCode) {
        AccessResolutionResult result = accessResolutionService.resolve(accessCode);
        return new AccessResolutionResultDto(result.quizId(), result.teamId(), result.teamName());
    }
}
```

**Public DTOs:**

```java
public record AuthenticationResultDto(String token, String role) {}
public record AccessResolutionResultDto(Long quizId, Long teamId, String teamName) {}
```

**Key design decisions:**
- Auth does NOT own any JPA entities. It reads `User` via the `user` module's facade (for credential validation) or directly if `auth` has `allowedDependencies = {"shared", "user"}`.
- **Alternative (simpler):** `AuthenticationService` keeps a direct `UserRepository` dependency during migration Phase 2, but references only `Long userId` in its public API. Full decoupling happens in Phase 4 (user module extraction).
- `JwtConfig`, `SecurityConfig`, `CorsConfig` live in auth's infrastructure layer but apply globally since Spring Security's filter chain is application-scoped.

#### 2.2.3 Quiz Module Design

**Facade API:**

```java
@Service
public class QuizFacade {

    private final QuizManagementService quizManagementService;
    private final QuestionManagementService questionManagementService;
    private final QuizSessionService quizSessionService;

    /** Get read-only quiz summary for other modules */
    public QuizInfoDto getQuizInfo(Long quizId) {
        Quiz quiz = quizManagementService.getQuiz(quizId);
        return new QuizInfoDto(quiz.getId(), quiz.getTitle(), quiz.getStatus(),
                               quiz.isLiveSession(), quiz.getProctorPin());
    }

    /** Get question data for grading (used by submission module) */
    public QuestionInfoDto getQuestionForGrading(Long questionId) {
        Question q = questionManagementService.getQuestion(questionId);
        return new QuestionInfoDto(q.getId(), q.getCorrectKey(), q.getPoints(),
                                   q.getType(), q.getTimeLimit());
    }

    /** Get ordered questions for a quiz (used by realtime module) */
    public List<QuestionInfoDto> getOrderedQuestions(Long quizId) {
        return questionManagementService.getQuestionsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .map(q -> new QuestionInfoDto(q.getId(), q.getCorrectKey(),
                                               q.getPoints(), q.getType(), q.getTimeLimit()))
                .toList();
    }

    /** Check quiz existence */
    public boolean quizExists(Long quizId) {
        return quizManagementService.quizExists(quizId);
    }

    /** Activate session (called by realtime module's saga) */
    public void activateSession(Long quizId) {
        quizSessionService.activateSession(quizId);
    }

    /** Deactivate session (called by realtime module's saga compensation) */
    public void deactivateSession(Long quizId) {
        quizSessionService.deactivateSession(quizId);
    }
}
```

**Public DTOs:**

```java
public record QuizInfoDto(Long id, String title, QuizStatus status,
                           boolean isLive, String proctorPin) {}

public record QuestionInfoDto(Long id, String correctKey, int points,
                               QuestionType type, int timeLimit) {}
```

**Event contracts:**

```java
// All in com.intelliquiz.api.quiz.events
public record QuizCreatedEvent(Long quizId, String title, Instant occurredAt) {}
public record QuizStatusChangedEvent(Long quizId, QuizStatus oldStatus,
                                      QuizStatus newStatus, Instant occurredAt) {}
public record QuizSessionActivatedEvent(Long quizId, Instant occurredAt) {}
public record QuizSessionDeactivatedEvent(Long quizId, Instant occurredAt) {}
public record QuestionAddedEvent(Long questionId, Long quizId, Instant occurredAt) {}
public record QuestionDeletedEvent(Long questionId, Long quizId, Instant occurredAt) {}
```

**Domain entity enrichment — Quiz aggregate:**

```java
// Quiz.java — additions for DDD
@Entity
@Table(name = "quiz")
public class Quiz {
    // ... existing fields ...

    // DDD: enforce state machine invariant
    public void activate() {
        if (this.status != QuizStatus.READY) {
            throw new QuizNotReadyException("Quiz must be READY. Current: " + this.status);
        }
        this.isLiveSession = true;
    }

    // DDD: guard transition
    public void transitionToReady() {
        if (this.questions == null || this.questions.isEmpty()) {
            throw new InvalidQuizStateException("Need ≥1 question to become READY");
        }
        this.status = QuizStatus.READY;
    }

    // DDD: aggregate root controls child collection
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null);
    }
}
```

#### 2.2.4 User Module Design

**Facade API:**

```java
@Service
public class UserFacade {

    private final UserManagementService userManagementService;

    /** Get user info for auth module credential validation */
    public UserInfoDto getUserByUsername(String username) {
        User user = userManagementService.getAdminByUsername(username);
        return new UserInfoDto(user.getId(), user.getUsername(),
                               user.getPassword(), user.getSystemRole());
    }

    /** Check if user has permission for a quiz */
    public boolean hasPermission(Long userId, Long quizId, AdminPermission permission) {
        User user = userManagementService.getAdmin(userId);
        // Super admins bypass checks
        if (user.isSuperAdmin()) return true;
        return userManagementService.getUserAssignments(userId).stream()
                .filter(a -> a.getQuiz().getId().equals(quizId))
                .anyMatch(a -> a.hasPermission(permission));
    }
}
```

**Event contracts:**

```java
public record UserCreatedEvent(Long userId, String username, SystemRole role, Instant occurredAt) {}
public record UserDeletedEvent(Long userId, Instant occurredAt) {}
public record PermissionsAssignedEvent(Long userId, Long quizId,
                                        Set<AdminPermission> permissions, Instant occurredAt) {}
public record PermissionsRevokedEvent(Long userId, Long quizId, Instant occurredAt) {}
```

**JPA relationship change — QuizAssignment:**

The `QuizAssignment` entity currently holds `@ManyToOne` references to both `User` and `Quiz`. Since it's owned by the `user` module, the `Quiz` reference must become an ID:

```java
// BEFORE (current — cross-module entity reference)
@ManyToOne
@JoinColumn(name = "quiz_id", nullable = false)
private Quiz quiz;

// AFTER (migrated — ID reference only)
@Column(name = "quiz_id", nullable = false)
private Long quizId;
// Use QuizFacade.quizExists(quizId) for validation
```

#### 2.2.5 Team Module Design

**Facade API:**

```java
@Service
public class TeamFacade {

    private final TeamRegistrationService teamRegistrationService;

    public TeamInfoDto getTeamInfo(Long teamId) {
        Team team = teamRegistrationService.getTeam(teamId);
        return new TeamInfoDto(team.getId(), team.getName(),
                               team.getQuizId(), team.getAccessCode(), team.getTotalScore());
    }

    public TeamInfoDto getTeamByAccessCode(String accessCode) {
        Team team = teamRegistrationService.getTeamByAccessCode(accessCode);
        return new TeamInfoDto(team.getId(), team.getName(),
                               team.getQuizId(), team.getAccessCode(), team.getTotalScore());
    }

    public List<TeamInfoDto> getTeamsByQuiz(Long quizId) {
        return teamRegistrationService.getTeamsByQuiz(quizId).stream()
                .map(t -> new TeamInfoDto(t.getId(), t.getName(),
                                          t.getQuizId(), t.getAccessCode(), t.getTotalScore()))
                .toList();
    }

    public int getTeamCount(Long quizId) {
        return teamRegistrationService.getTeamsByQuiz(quizId).size();
    }
}
```

**JPA relationship change — Team entity:**

```java
// BEFORE (current — cross-module @ManyToOne)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "quiz_id", nullable = false)
@JsonBackReference("quiz-teams")
private Quiz quiz;

// AFTER (migrated — ID reference + facade call for validation)
@Column(name = "quiz_id", nullable = false)
private Long quizId;
// TeamRegistrationService calls QuizFacade.quizExists(quizId) before registration
```

**Event contracts:**

```java
public record TeamRegisteredEvent(Long teamId, Long quizId, String teamName, Instant occurredAt) {}
public record TeamRemovedEvent(Long teamId, Long quizId, Instant occurredAt) {}
public record TeamScoreResetEvent(Long quizId, Instant occurredAt) {}
```

**Value Object — AccessCode:**

```java
// com.intelliquiz.api.team.internal.domain.valueobjects.AccessCode
public record AccessCode(String value) {
    private static final Pattern VALID_FORMAT = Pattern.compile("^[A-Z0-9]{6}$");

    public AccessCode {
        Objects.requireNonNull(value, "Access code must not be null");
        if (!VALID_FORMAT.matcher(value).matches()) {
            throw new InvalidAccessCodeException(
                "Access code must be 6 uppercase alphanumeric characters, got: " + value);
        }
    }
}
```

#### 2.2.6 Submission Module Design

**Facade API:**

```java
@Service
public class SubmissionFacade {

    private final SubmissionService submissionService;

    public SubmissionInfoDto submitAnswer(Long teamId, Long questionId, String answer) {
        Submission s = submissionService.submitAnswer(teamId, questionId, answer);
        return toDto(s);
    }

    public SubmissionInfoDto submitAnswerWithGrading(Long teamId, Long questionId, String answer) {
        Submission s = submissionService.submitAnswerWithGrading(teamId, questionId, answer);
        return toDto(s);
    }

    public boolean hasSubmitted(Long teamId, Long questionId) {
        return submissionService.hasSubmitted(teamId, questionId);
    }

    public int countSubmissionsForQuestion(Long questionId) {
        return submissionService.countSubmissionsForQuestion(questionId);
    }
}
```

**JPA relationship changes — Submission entity:**

```java
// BEFORE (current — cross-module entity references)
@ManyToOne
@JoinColumn(name = "team_id", nullable = false)
private Team team;

@ManyToOne
@JoinColumn(name = "question_id", nullable = false)
private Question question;

// AFTER (migrated — ID references)
@Column(name = "team_id", nullable = false)
private Long teamId;

@Column(name = "question_id", nullable = false)
private Long questionId;
// Uses QuizFacade.getQuestionForGrading(questionId) for grading
// Uses TeamFacade.getTeamInfo(teamId) for validation
```

**Event contracts:**

```java
public record AnswerSubmittedEvent(Long submissionId, Long teamId,
                                    Long questionId, Long quizId, Instant occurredAt) {}
public record SubmissionGradedEvent(Long submissionId, Long teamId, Long questionId,
                                     Long quizId, int score, boolean isCorrect,
                                     Instant occurredAt) {}
```

**Event listener — cleanup on external events:**

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

#### 2.2.7 Scoreboard Module Design (CQRS)

The scoreboard module is the only CQRS module. It has NO write API — all data comes from events.

**Facade API (query-only):**

```java
@Service
public class ScoreboardFacade {

    private final ScoreboardQueryService queryService;

    /** Get leaderboard for a quiz — reads from denormalized table */
    public List<ScoreboardEntryDto> getLeaderboard(Long quizId) {
        return queryService.getLeaderboard(quizId).stream()
                .map(e -> new ScoreboardEntryDto(e.getRank(), e.getTeamId(),
                                                  e.getTeamName(), e.getTotalScore(), e.isTied()))
                .toList();
    }
}
```

**Read Model Entity:**

```java
@Entity
@Table(name = "scoreboard_entries", indexes = {
    @Index(name = "idx_scoreboard_quiz_rank", columnList = "quiz_id, rank")
})
public class ScoreboardEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "total_score", nullable = false)
    private int totalScore = 0;

    @Column(nullable = false)
    private int rank = 0;

    @Column(name = "is_tied", nullable = false)
    private boolean isTied = false;

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;

    // Business method
    public void addScore(int points) {
        this.totalScore += points;
        this.lastUpdated = Instant.now();
    }

    public void resetScore() {
        this.totalScore = 0;
        this.rank = 0;
        this.lastUpdated = Instant.now();
    }
}
```

**Projection (event sync):**

```java
@Component
public class ScoreboardProjection {

    private final ScoreboardReadRepository readRepo;

    @ApplicationModuleListener
    public void on(SubmissionGradedEvent event) {
        ScoreboardEntry entry = readRepo
                .findByTeamIdAndQuizId(event.teamId(), event.quizId())
                .orElseGet(() -> {
                    ScoreboardEntry newEntry = new ScoreboardEntry();
                    newEntry.setTeamId(event.teamId());
                    newEntry.setQuizId(event.quizId());
                    newEntry.setTeamName(resolveTeamName(event.teamId()));
                    return newEntry;
                });

        if (event.isCorrect()) {
            entry.addScore(event.score());
        }
        readRepo.save(entry);
        recalculateRanks(event.quizId());
    }

    @ApplicationModuleListener
    public void on(TeamScoreResetEvent event) {
        List<ScoreboardEntry> entries = readRepo.findByQuizId(event.quizId());
        entries.forEach(ScoreboardEntry::resetScore);
        readRepo.saveAll(entries);
    }

    @ApplicationModuleListener
    public void on(TeamRegisteredEvent event) {
        ScoreboardEntry entry = new ScoreboardEntry();
        entry.setTeamId(event.teamId());
        entry.setQuizId(event.quizId());
        entry.setTeamName(event.teamName());
        entry.setLastUpdated(Instant.now());
        readRepo.save(entry);
    }

    @ApplicationModuleListener
    public void on(TeamRemovedEvent event) {
        readRepo.deleteByTeamIdAndQuizId(event.teamId(), event.quizId());
        recalculateRanks(event.quizId());
    }

    private void recalculateRanks(Long quizId) {
        List<ScoreboardEntry> entries = readRepo.findByQuizIdOrderByTotalScoreDesc(quizId);
        int rank = 1;
        for (int i = 0; i < entries.size(); i++) {
            if (i > 0 && entries.get(i).getTotalScore() < entries.get(i - 1).getTotalScore()) {
                rank = i + 1;
            }
            entries.get(i).setRank(rank);
            boolean tied = entries.stream()
                    .filter(e -> e.getTotalScore() == entries.get(i).getTotalScore())
                    .count() > 1;
            entries.get(i).setTied(tied);
        }
        readRepo.saveAll(entries);
    }

    private String resolveTeamName(Long teamId) {
        // Call TeamFacade for team name — or carry it in the event payload
        return "Team-" + teamId; // fallback; prefer carrying teamName in event
    }
}
```

**Query Service:**

```java
@Service
@Transactional(readOnly = true)
public class ScoreboardQueryService {

    private final ScoreboardReadRepository readRepo;

    public List<ScoreboardEntry> getLeaderboard(Long quizId) {
        return readRepo.findByQuizIdOrderByRankAsc(quizId);
    }
}
```

#### 2.2.8 Backup Module Design (Saga)

**Facade API:**

```java
@Service
public class BackupFacade {

    private final BackupServiceImpl backupService;

    public BackupRecordDto createBackup(Long createdByUserId) {
        // Resolve user via UserFacade or pass user ID only
        BackupRecord record = backupService.createBackup(createdByUserId);
        return toDto(record);
    }

    public BackupRecordDto restoreFromBackup(Long backupId, Long restoredByUserId) {
        BackupRecord record = backupService.restoreFromBackup(backupId, restoredByUserId);
        return toDto(record);
    }

    public List<BackupRecordDto> listBackups() {
        return backupService.listBackups().stream().map(this::toDto).toList();
    }
}
```

**Saga Design — Backup Restore:**

```java
// Inside BackupServiceImpl (Application layer)
@Transactional
public BackupRecord restoreFromBackup(Long id, Long restoredByUserId) {
    BackupRecord record = backupRecordRepository.findById(id)
            .orElseThrow(() -> new BackupNotFoundException(id));
    Path backupPath = getBackupPath(record.getFilename());

    // === SAGA STEP 1: Validate ===
    if (!Files.exists(backupPath)) {
        throw new BackupFileNotFoundException(record.getFilename());
    }

    // === SAGA STEP 2: Safety backup ===
    BackupRecord safetyBackup = createBackup(restoredByUserId);
    Path safetyPath = getBackupPath(safetyBackup.getFilename());

    try {
        // === SAGA STEP 3: Execute restore ===
        postgresBackupExecutor.restoreFromDump(backupPath);

        // === SAGA STEP 4: Update record ===
        record.setLastRestoredAt(LocalDateTime.now());
        record = backupRecordRepository.save(record);

        // === SAGA STEP 5: Publish event ===
        eventPublisher.publishEvent(new BackupRestoredEvent(
                record.getId(), record.getFilename(), Instant.now()));

        return record;

    } catch (Exception e) {
        // === COMPENSATION: Restore from safety backup ===
        logger.error("Restore failed, compensating with safety backup: {}", e.getMessage());
        try {
            postgresBackupExecutor.restoreFromDump(safetyPath);
            record.setErrorMessage("Restore failed: " + e.getMessage());
            record.setStatus(BackupStatus.FAILED);
            backupRecordRepository.save(record);
        } catch (Exception compensationEx) {
            logger.error("CRITICAL: Compensation also failed: {}", compensationEx.getMessage());
            // Manual intervention required at this point
        }
        throw new BackupException("Restore failed and was rolled back", e);
    }
}
```

#### 2.2.9 Realtime Module Design (Saga + Event Consumer)

**Facade API:**

```java
@Service
public class RealtimeFacade {

    private final GameFlowService gameFlowService;

    /** Trigger a live broadcast to all connected clients */
    public void broadcastToQuiz(Long quizId, Object payload) {
        gameFlowService.broadcast(quizId, payload);
    }
}
```

**GameFlowService refactored — Saga + Facade dependencies:**

```java
@Service
public class GameFlowService {

    // INTERNAL collaborators (same module)
    private final QuizTimerService timerService;
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;
    private final AnswerDistributionService distributionService;

    // EXTERNAL module facades (replacing direct repository access)
    private final QuizFacade quizFacade;
    private final TeamFacade teamFacade;
    private final SubmissionFacade submissionFacade;

    private final ApplicationEventPublisher eventPublisher;

    // === SAGA: Quiz Activation ===
    public void activateQuiz(Long quizId) {
        boolean quizActivated = false;
        boolean sessionInitialized = false;

        try {
            // Step 1: Deactivate other live quizzes
            quizFacade.deactivateAllLiveSessions();

            // Step 2: Activate target quiz
            quizFacade.activateSession(quizId);
            quizActivated = true;

            // Step 3: Initialize WebSocket session
            sessionManager.initializeSession(quizId);
            sessionInitialized = true;

            // Step 4: Notify clients
            broadcastService.broadcastGameState(quizId,
                    GameStateMessage.lobby(quizId));

        } catch (Exception e) {
            // COMPENSATE
            if (sessionInitialized) {
                sessionManager.clearQuizSession(quizId);
            }
            if (quizActivated) {
                quizFacade.deactivateSession(quizId);
            }
            broadcastService.broadcastError(quizId, "Quiz activation failed");
            throw e;
        }
    }

    // Remaining methods (showQuestion, handleSubmission, etc.)
    // now use QuizFacade/TeamFacade/SubmissionFacade instead of repositories
}
```

**Event Listener:**

```java
@Component
public class RealtimeEventListener {

    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;

    @ApplicationModuleListener
    public void on(TeamRegisteredEvent event) {
        if (sessionManager.isSessionActive(event.quizId())) {
            broadcastService.broadcastTeamJoined(event.quizId(),
                    new TeamInfo(event.teamId(), event.teamName()));
        }
    }

    @ApplicationModuleListener
    public void on(SubmissionGradedEvent event) {
        if (sessionManager.isSessionActive(event.quizId())) {
            broadcastService.notifyHostSubmissionGraded(event.quizId(),
                    event.teamId(), event.score());
        }
    }

    @ApplicationModuleListener
    public void on(QuizSessionDeactivatedEvent event) {
        sessionManager.clearQuizSession(event.quizId());
    }
}
```

### 2.3 Event Flow Design

#### 2.3.1 Complete Event Flow Map

```
┌─────────────┐     QuizCreatedEvent            ┌──────────────┐
│             │────────────────────────────────►│   realtime   │
│             │     QuizStatusChangedEvent       │              │
│    quiz     │────────────────────────────────►│ (listener)   │
│             │     QuizSessionActivatedEvent    │              │
│             │────────────────────────────────►│              │
│             │     QuestionDeletedEvent         ├──────────────┤
│             │─────────────────────┐           │              │
└─────────────┘                     │           │              │
                                    ▼           │              │
                              ┌──────────────┐  │              │
                              │ submission   │  │              │
                              │ (listener)   │  │              │
                              └──────────────┘  └──────────────┘

┌─────────────┐    TeamRegisteredEvent           ┌──────────────┐
│    team     │────────────────────────────────►│   realtime   │
│             │    TeamRemovedEvent              │              │
│             │────────────────────────┬───────►│ (listener)   │
│             │    TeamScoreResetEvent │        └──────────────┘
│             │──────────────────┐    │
└─────────────┘                  │    │         ┌──────────────┐
                                 │    └────────►│ submission   │
                                 │              │ (listener)   │
                                 │              └──────────────┘
                                 │              ┌──────────────┐
                                 └─────────────►│ scoreboard   │
                                                │ (projection) │
                                                └──────────────┘

┌─────────────┐    SubmissionGradedEvent         ┌──────────────┐
│ submission  │────────────────────────────────►│ scoreboard   │
│             │                                 │ (projection) │
│             │────────────────────────────────►├──────────────┤
│             │    AnswerSubmittedEvent          │   realtime   │
│             │────────────────────────────────►│ (listener)   │
└─────────────┘                                 └──────────────┘

┌─────────────┐    PermissionsAssignedEvent      ┌──────────────┐
│    user     │────────────────────────────────►│    auth      │
│             │    PermissionsRevokedEvent       │ (listener)   │
│             │────────────────────────────────►│              │
└─────────────┘                                 └──────────────┘
```

#### 2.3.2 Synchronous vs Asynchronous Event Decisions

| Event | Delivery | Rationale |
|---|---|---|
| `QuestionDeletedEvent` → submission cleanup | **Synchronous** (`BEFORE_COMMIT`) | Must succeed with publisher's transaction — orphaned submissions are data integrity issues |
| `TeamRemovedEvent` → submission cleanup | **Synchronous** (`BEFORE_COMMIT`) | Same reason — cascade cleanup must be atomic |
| `SubmissionGradedEvent` → scoreboard projection | **Asynchronous** (`@ApplicationModuleListener`) | Eventual consistency acceptable for leaderboard; scoreboard should not block grading |
| `TeamRegisteredEvent` → realtime broadcast | **Asynchronous** | UI notification is non-critical; should not block team registration |
| `PermissionsAssignedEvent` → auth cache | **Asynchronous** | Cache refresh is best-effort; stale auth is acceptable for seconds |
| `BackupRestoredEvent` → audit log | **Asynchronous** | Audit logging should never block backup operations |

### 2.4 Cross-Cutting Design

#### 2.4.1 JPA Entity Relationship Migration Plan

All cross-module JPA `@ManyToOne`/`@OneToMany` navigations must be converted to ID references:

| Entity | Field | Current | Target | Migration Approach |
|---|---|---|---|---|
| `Team.quiz` | `@ManyToOne Quiz` | Entity ref | `Long quizId` | Replace field; remove `@JsonBackReference`; add `@Column` |
| `Team.submissions` | `@OneToMany Submission` | Navigable | **Remove** | Submissions queried via `SubmissionFacade` |
| `Submission.team` | `@ManyToOne Team` | Entity ref | `Long teamId` | Replace field; add `@Column` |
| `Submission.question` | `@ManyToOne Question` | Entity ref | `Long questionId` | Replace field; add `@Column` |
| `QuizAssignment.quiz` | `@ManyToOne Quiz` | Entity ref | `Long quizId` | Replace field; validate via `QuizFacade` |
| `BackupRecord.createdBy` | `@ManyToOne User` | Entity ref | `Long createdByUserId` | Replace field; add `@Column` |
| `Quiz.teams` | `@OneToMany Team` | Navigable | **Remove** | Teams queried via `TeamFacade` |
| `Quiz.assignments` | `@OneToMany QuizAssignment` | Navigable | **Remove** | Assignments queried via `UserFacade` |
| `Quiz.questions` | `@OneToMany Question` | Navigable | **Keep** | Same module — valid aggregate |
| `User.assignments` | `@OneToMany QuizAssignment` | Navigable | **Keep** | Same module — valid aggregate |

#### 2.4.2 Security Filter Chain Design

```
HTTP Request
    │
    ▼
┌──────────────────────────────────────┐
│ JwtAuthenticationFilter              │  ← auth module (infrastructure/config)
│ - Extract JWT from Authorization hdr │
│ - Validate token signature + expiry  │
│ - Set SecurityContext                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ SecurityConfig (filter chain rules)  │  ← auth module (infrastructure/config)
│ - /api/auth/** → permitAll           │
│ - /api/access/** → permitAll         │
│ - /ws/** → permitAll (WS has own auth│
│ - All other /api/** → authenticated  │
└──────────────┬───────────────────────┘
               │
               ▼
       Module Controllers
```

The security configuration lives physically in the `auth` module but applies globally. This is acceptable because:
1. Spring Security's `SecurityFilterChain` is inherently application-scoped
2. Spring Modulith's `@ApplicationModule` boundary enforcement operates at the Spring bean level, not at the servlet filter level
3. The auth module is loaded early in Spring context initialization

#### 2.4.3 Global Exception Handler Design

```java
// com.intelliquiz.api.shared.exception.GlobalExceptionHandler
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidQuizStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidState(InvalidQuizStateException ex) {
        return ResponseEntity.status(409).body(new ErrorResponse(409, ex.getMessage()));
    }

    // ... all existing handlers preserved with same status codes ...
}
```

**Mapping:** Unchanged from current behavior. All HTTP status codes and response shapes remain identical.

#### 2.4.4 Database Schema Changes

The migrated schema requires **no destructive changes**. Only FK columns that was previously managed by JPA `@ManyToOne` now become plain `@Column` fields — the database columns remain identical:

| Table | Column | Change |
|---|---|---|
| `team` | `quiz_id` | Was FK managed by `@ManyToOne` → now `@Column`-managed `Long`. DB column unchanged. |
| `submission` | `team_id` | Same as above |
| `submission` | `question_id` | Same as above |
| `quiz_assignment` | `quiz_id` | Same as above |
| `backup_record` | `created_by_user_id` | Same as above |
| `scoreboard_entries` | *(new table)* | **New table** for CQRS read model |

**New table DDL** (auto-created by JPA `ddl-auto=update`):

```sql
CREATE TABLE scoreboard_entries (
    id              BIGSERIAL PRIMARY KEY,
    team_id         BIGINT NOT NULL,
    quiz_id         BIGINT NOT NULL,
    team_name       VARCHAR(255) NOT NULL,
    total_score     INT NOT NULL DEFAULT 0,
    rank            INT NOT NULL DEFAULT 0,
    is_tied         BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated    TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_scoreboard_quiz_rank ON scoreboard_entries (quiz_id, rank);
CREATE UNIQUE INDEX idx_scoreboard_team_quiz ON scoreboard_entries (team_id, quiz_id);
```

### 2.5 Testing Design

#### 2.5.1 Module Verification Test

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
        assertThat(modules.stream().count()).isEqualTo(9);
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

#### 2.5.2 Per-Module Integration Test Template

```java
@ApplicationModuleTest(mode = BootstrapMode.DIRECT_DEPENDENCIES)
class QuizModuleTest {

    @Autowired QuizFacade quizFacade;
    @Autowired QuizManagementService quizService;

    @Test
    void shouldCreateQuizAndPublishEvent(Scenario scenario) {
        scenario.stimulate(() -> quizService.createQuiz(
                    new CreateQuizCommand("Test Quiz", "Description")))
                .andWaitForEventOfType(QuizCreatedEvent.class)
                .toArriveAndVerify(event -> {
                    assertThat(event.title()).isEqualTo("Test Quiz");
                    assertThat(event.quizId()).isNotNull();
                });
    }

    @Test
    void shouldTransitionFromDraftToReady() {
        // Create quiz, add question, transition
        Quiz quiz = quizService.createQuiz(new CreateQuizCommand("Quiz", "Desc"));
        questionService.addQuestion(quiz.getId(), ...);
        Quiz ready = quizService.transitionToReady(quiz.getId());
        assertThat(ready.getStatus()).isEqualTo(QuizStatus.READY);
    }
}
```

#### 2.5.3 CQRS Projection Test

```java
@ApplicationModuleTest
class ScoreboardProjectionTest {

    @Autowired ScoreboardProjection projection;
    @Autowired ScoreboardReadRepository readRepo;

    @Test
    void shouldUpdateScoreOnSubmissionGraded() {
        // Given a team registered
        projection.on(new TeamRegisteredEvent(1L, 100L, "Team A", Instant.now()));

        // When graded event arrives
        projection.on(new SubmissionGradedEvent(10L, 1L, 5L, 100L, 10, true, Instant.now()));

        // Then read model is updated
        ScoreboardEntry entry = readRepo.findByTeamIdAndQuizId(1L, 100L).orElseThrow();
        assertThat(entry.getTotalScore()).isEqualTo(10);
        assertThat(entry.getRank()).isEqualTo(1);
    }

    @Test
    void shouldBeIdempotent() {
        projection.on(new TeamRegisteredEvent(1L, 100L, "Team A", Instant.now()));
        projection.on(new SubmissionGradedEvent(10L, 1L, 5L, 100L, 10, true, Instant.now()));
        // Process same event again
        projection.on(new SubmissionGradedEvent(10L, 1L, 5L, 100L, 10, true, Instant.now()));
        // Score should NOT be doubled (idempotency check with submissionId)
    }
}
```

