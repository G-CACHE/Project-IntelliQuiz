# Spring Modulith Migration Guide for IntelliQuiz

## Overview
This guide outlines the migration strategy to transform the IntelliQuiz backend from a layered Spring Boot application into a Spring Modulith architecture with well-defined module boundaries.

## Current Architecture Analysis

### Existing Structure
```
com.intelliquiz.api
├── application
│   ├── commands
│   └── services
├── domain
│   ├── entities
│   ├── enums
│   ├── exceptions
│   ├── ports
│   └── services
├── infrastructure
│   ├── config
│   ├── persistence
│   └── websocket
└── presentation
    └── controllers
```

### Key Observations
- Strong DDD foundation with rich domain entities
- Hexagonal architecture (ports/adapters pattern)
- Clear separation of concerns
- JWT-based stateless authentication
- Real-time WebSocket capabilities

## Proposed Module Structure

### Module Dependency Graph
```
shared (foundation)
  ↑
  ├── auth (authentication & authorization)
  │    ↑
  │    ├── user (user management)
  │    └── quiz (quiz management)
  │         ↑
  │         ├── team (team registration)
  │         │    ↑
  │         │    ├── submission (answer submission)
  │         │    │    ↑
  │         │    │    └── scoreboard (leaderboard)
  │         │    └── realtime (websocket)
  │         └── backup (database backup)
```

## Module Definitions

### 1. Shared Module
**Package**: `com.intelliquiz.api.shared`

**Purpose**: Common domain exceptions, enums, and utilities

**Contents**:
- Domain exceptions (DomainException, EntityNotFoundException, etc.)
- Common enums (QuizStatus, QuestionType, Difficulty, SystemRole, AdminPermission, BackupStatus)
- Shared value objects
- CodeGenerationService
- Common utilities

**Public API**:
- All shared exceptions
- All shared enums
- Utility services

**Dependencies**: None

---

### 2. Auth Module
**Package**: `com.intelliquiz.api.auth`

**Purpose**: Authentication and authorization

**Contents**:
- **Domain**: User, QuizAssignment entities
- **Services**: AuthenticationService, AuthorizationService, AccessResolutionService
- **Infrastructure**: JwtConfig, JwtAuthenticationFilter, SecurityConfig
- **Ports**: UserRepository, PasswordHashingService
- **DTOs**: AuthenticationResult, AccessResolutionResult

**Public API**:
```java
// Authentication
AuthenticationResult authenticate(String username, String password)

// Authorization
void checkQuizAccess(User user, Quiz quiz)
boolean hasPermission(User user, Quiz quiz, AdminPermission permission)

// Access Resolution
AccessResolutionResult resolveAccessCode(String code)
```

**Published Events**:
- UserAuthenticatedEvent
- AuthorizationFailedEvent

**Dependencies**: shared

---

### 3. User Module
**Package**: `com.intelliquiz.api.user`

**Purpose**: Admin account management

**Contents**:
- **Services**: UserManagementService
- **Commands**: CreateUserCommand, UpdateUserCommand
- **Controllers**: UserController
- **DTOs**: UserDTO, QuizAssignmentDTO

**Public API**:
```java
User createAdmin(CreateUserCommand command)
User updateAdmin(Long userId, UpdateUserCommand command)
void deleteAdmin(Long userId)
void assignQuizPermissions(Long userId, Long quizId, Set<AdminPermission> permissions)
void revokeQuizPermissions(Long userId, Long quizId)
```

**Published Events**:
- UserCreatedEvent
- UserUpdatedEvent
- UserDeletedEvent
- PermissionsAssignedEvent
- PermissionsRevokedEvent

**Dependencies**: shared, auth

---

### 4. Quiz Module
**Package**: `com.intelliquiz.api.quiz`

**Purpose**: Quiz and question lifecycle management

**Contents**:
- **Domain**: Quiz, Question entities
- **Services**: QuizManagementService, QuestionManagementService, QuizSessionService
- **Commands**: CreateQuizCommand, UpdateQuizCommand, CreateQuestionCommand, UpdateQuestionCommand
- **Controllers**: QuizController, QuestionController
- **Ports**: QuizRepository, QuestionRepository

**Public API**:
```java
// Quiz Management
Quiz createQuiz(CreateQuizCommand command)
Quiz updateQuiz(Long quizId, UpdateQuizCommand command)
void deleteQuiz(Long quizId)
void transitionToReady(Long quizId)
void archiveQuiz(Long quizId)

// Session Management
void activateSession(Long quizId)
void deactivateSession(Long quizId)

// Question Management
Question addQuestion(Long quizId, CreateQuestionCommand command)
Question updateQuestion(Long questionId, UpdateQuestionCommand command)
void deleteQuestion(Long questionId)
void reorderQuestions(Long quizId, List<Long> questionIds)
```

**Published Events**:
- QuizCreatedEvent
- QuizUpdatedEvent
- QuizDeletedEvent
- QuizTransitionedToReadyEvent
- QuizArchivedEvent
- QuizSessionActivatedEvent
- QuizSessionDeactivatedEvent
- QuestionAddedEvent
- QuestionUpdatedEvent
- QuestionDeletedEvent

**Dependencies**: shared, auth

---

### 5. Team Module
**Package**: `com.intelliquiz.api.team`

**Purpose**: Team registration and participation

**Contents**:
- **Domain**: Team entity
- **Services**: TeamRegistrationService
- **Controllers**: TeamController
- **Ports**: TeamRepository

**Public API**:
```java
Team registerTeam(Long quizId, String teamName)
void removeTeam(Long teamId)
void resetTeamScore(Long teamId)
List<Team> getTeamsByQuiz(Long quizId)
```

**Published Events**:
- TeamRegisteredEvent
- TeamRemovedEvent
- TeamScoreResetEvent

**Dependencies**: shared, quiz

---

### 6. Submission Module
**Package**: `com.intelliquiz.api.submission`

**Purpose**: Answer submission and grading

**Contents**:
- **Domain**: Submission entity
- **Services**: SubmissionService
- **Controllers**: SubmissionController
- **Ports**: SubmissionRepository

**Public API**:
```java
Submission submitAnswer(Long teamId, Long questionId, String answer)
void gradeSubmission(Long submissionId)
List<Submission> getSubmissionsByTeam(Long teamId)
List<Submission> getSubmissionsByQuestion(Long questionId)
```

**Published Events**:
- AnswerSubmittedEvent
- SubmissionGradedEvent

**Listens To**:
- QuestionDeletedEvent (cleanup submissions)

**Dependencies**: shared, quiz, team

---

### 7. Scoreboard Module
**Package**: `com.intelliquiz.api.scoreboard`

**Purpose**: Leaderboard and scoring

**Contents**:
- **Services**: ScoreboardService
- **Controllers**: ScoreboardController
- **DTOs**: ScoreboardEntry

**Public API**:
```java
List<ScoreboardEntry> getScoreboard(Long quizId)
```

**Listens To**:
- SubmissionGradedEvent (recalculate scores)
- TeamScoreResetEvent (update leaderboard)

**Dependencies**: shared, team, submission

---

### 8. Backup Module
**Package**: `com.intelliquiz.api.backup`

**Purpose**: Database backup and recovery

**Contents**:
- **Domain**: BackupRecord entity
- **Services**: BackupServiceImpl
- **Ports**: BackupRecordRepository, PostgresBackupExecutor
- **Controllers**: BackupController
- **Config**: BackupProperties, BackupDirectoryInitializer

**Public API**:
```java
BackupRecord createBackup()
void restoreBackup(Long backupId)
List<BackupRecord> listBackups()
byte[] downloadBackup(Long backupId)
```

**Published Events**:
- BackupCreatedEvent
- BackupRestoredEvent

**Dependencies**: shared, auth

---

### 9. Realtime Module
**Package**: `com.intelliquiz.api.realtime`

**Purpose**: WebSocket communication and real-time updates

**Contents**:
- **Infrastructure**: WebSocketConfig, QuizSessionManager, WebSocketAuthInterceptor
- **Services**: QuizBroadcastService
- **Listeners**: WebSocketEventListener
- **DTOs**: GameState, TimerUpdate

**Public API**:
```java
void broadcastGameState(Long quizId, GameState state)
void broadcastTimerUpdate(Long quizId, int remainingSeconds)
void sendHostNotification(Long quizId, String message)
void sendTeamMessage(Long teamId, String message)
void registerHost(Long quizId, String sessionId)
void registerParticipant(Long quizId, Long teamId, String sessionId)
```

**Listens To**:
- QuizSessionActivatedEvent
- QuizSessionDeactivatedEvent
- AnswerSubmittedEvent
- SubmissionGradedEvent

**Dependencies**: shared, quiz, team, submission

---

## Migration Steps

### Phase 1: Setup and Preparation
1. ✅ Add Spring Modulith dependencies to pom.xml
2. Create module package structure
3. Add package-info.java files for each module
4. Define module boundaries and APIs

### Phase 2: Extract Shared Module
1. Move common exceptions to `shared.exceptions`
2. Move common enums to `shared.enums`
3. Move CodeGenerationService to `shared.services`
4. Create shared DTOs and value objects

### Phase 3: Extract Auth Module
1. Move User and QuizAssignment entities
2. Move authentication and authorization services
3. Move JWT infrastructure
4. Define public API and events
5. Update SecurityConfig

### Phase 4: Extract Core Business Modules
1. Extract Quiz module (quiz and question management)
2. Extract Team module (team registration)
3. Extract Submission module (answer submission)
4. Extract Scoreboard module (leaderboard)
5. Replace direct service calls with application events

### Phase 5: Extract Supporting Modules
1. Extract User module (admin management)
2. Extract Backup module (database operations)
3. Extract Realtime module (WebSocket)

### Phase 6: Testing and Validation
1. Run Spring Modulith verification tests
2. Test module boundaries
3. Generate module documentation
4. Verify event-driven communication
5. Integration testing

### Phase 7: Documentation and Observability
1. Generate module diagrams
2. Document module APIs
3. Add module observability
4. Update README and architecture docs

## Implementation Guidelines

### Module Structure Template
```
com.intelliquiz.api.<module>
├── package-info.java              # Module definition
├── domain                          # Domain entities (internal)
│   └── <Entity>.java
├── application                     # Application services (internal)
│   ├── services
│   │   └── <Service>.java
│   └── commands
│       └── <Command>.java
├── infrastructure                  # Infrastructure (internal)
│   ├── persistence
│   │   └── <RepositoryImpl>.java
│   └── config
│       └── <Config>.java
├── api                            # Public API (exposed)
│   ├── <ModuleFacade>.java       # Main entry point
│   ├── events                     # Published events
│   │   └── <Event>.java
│   └── dto                        # Data transfer objects
│       └── <DTO>.java
└── internal                       # Explicitly internal
    └── <InternalComponent>.java
```

### Package-info.java Example
```java
@org.springframework.modulith.ApplicationModule(
    displayName = "Quiz Management",
    allowedDependencies = {"shared", "auth"}
)
package com.intelliquiz.api.quiz;
```

### Event-Driven Communication
Replace direct service calls with application events:

**Before**:
```java
@Service
public class SubmissionService {
    private final ScoreboardService scoreboardService;
    
    public void gradeSubmission(Long id) {
        // grade logic
        scoreboardService.updateScoreboard(quizId);
    }
}
```

**After**:
```java
@Service
public class SubmissionService {
    private final ApplicationEventPublisher events;
    
    public void gradeSubmission(Long id) {
        // grade logic
        events.publishEvent(new SubmissionGradedEvent(submissionId, teamId, score));
    }
}

// In scoreboard module
@ApplicationModuleListener
public class ScoreboardEventListener {
    @Async
    @TransactionalEventListener
    public void on(SubmissionGradedEvent event) {
        // update scoreboard
    }
}
```

## Testing Strategy

### Module Verification Test
```java
@Test
void verifiesModularStructure() {
    ApplicationModules.of(IntelliQuizApiApplication.class)
        .verify();
}
```

### Module Integration Test
```java
@ApplicationModuleTest
class QuizModuleIntegrationTests {
    
    @Test
    void createsQuizSuccessfully(Scenario scenario) {
        // Test quiz module in isolation
    }
}
```

### Event Publication Test
```java
@Test
void publishesQuizCreatedEvent(Scenario scenario) {
    scenario.stimulate(() -> quizService.createQuiz(command))
        .andWaitForEventOfType(QuizCreatedEvent.class)
        .toArriveAndVerify(event -> {
            assertThat(event.getQuizId()).isNotNull();
        });
}
```

## Benefits of This Architecture

1. **Clear Boundaries**: Each module has well-defined responsibilities
2. **Loose Coupling**: Modules communicate via events, not direct calls
3. **Independent Testing**: Test modules in isolation
4. **Documentation**: Auto-generated module diagrams and documentation
5. **Observability**: Built-in metrics and tracing for module interactions
6. **Scalability**: Easy to extract modules into microservices later
7. **Maintainability**: Changes are localized to specific modules

## Next Steps

1. Review and approve the module structure
2. Start with Phase 1: Setup and Preparation
3. Incrementally migrate one module at a time
4. Test thoroughly after each module migration
5. Update documentation as you go

## Resources

- [Spring Modulith Documentation](https://docs.spring.io/spring-modulith/reference/)
- [Spring Modulith GitHub](https://github.com/spring-projects/spring-modulith)
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/)
