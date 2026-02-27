# Migration Visual Reference - File Movement Map

## Architecture: Pragmatic Hexagonal + DDD + Spring Modulith

**Key Principles**:
- ✅ Domain entities WITH @Entity (no separate JPA entities)
- ✅ Services instead of use cases (less boilerplate)
- ✅ Repository interfaces as ports (hexagonal)
- ✅ CQRS where beneficial (scoreboard)
- ✅ Domain events for communication

## Current → Target File Mapping

### 📦 Shared Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/exceptions/                    →         shared/exceptions/
  ├── DomainException.java            →           ├── DomainException.java
  ├── EntityNotFoundException.java    →           ├── EntityNotFoundException.java
  ├── AuthenticationFailedException   →           ├── AuthenticationFailedException
  ├── AuthorizationException          →           ├── AuthorizationException
  ├── InvalidQuizStateException       →           ├── InvalidQuizStateException
  ├── QuizNotReadyException           →           ├── QuizNotReadyException
  └── DuplicateSubmissionException    →           └── DuplicateSubmissionException

domain/enums/                         →         shared/enums/
  ├── QuizStatus.java                 →           ├── QuizStatus.java
  ├── QuestionType.java               →           ├── QuestionType.java
  ├── Difficulty.java                 →           ├── Difficulty.java
  ├── SystemRole.java                 →           ├── SystemRole.java
  ├── AdminPermission.java            →           ├── AdminPermission.java
  └── BackupStatus.java               →           └── BackupStatus.java

domain/services/                      →         shared/services/
  └── CodeGenerationService.java      →           └── CodeGenerationService.java

                                      →         shared/valueobjects/ (NEW)
                                      →           ├── AccessCode.java
                                      →           └── ProctorPin.java
```

---

### 🔐 Auth Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/entities/                      →         auth/domain/
  ├── User.java                       →           ├── User.java
  └── QuizAssignment.java             →           └── QuizAssignment.java

                                      →         auth/domain/events/ (NEW)
                                      →           ├── UserAuthenticatedEvent.java
                                      →           ├── AuthenticationFailedEvent.java
                                      →           └── AuthorizationFailedEvent.java

application/services/                 →         auth/application/services/
  ├── AuthenticationService.java      →           ├── AuthenticationService.java
  ├── AuthenticationResult.java       →           ├── AuthorizationService.java
  ├── AuthorizationService.java       →           └── AccessResolutionService.java
  ├── AccessResolutionService.java    →
  └── AccessResolutionResult.java     →         auth/application/dto/
                                      →           ├── AuthenticationResult.java
                                      →           └── AccessResolutionResult.java

infrastructure/config/                →         auth/infrastructure/security/
  ├── SecurityConfig.java             →           ├── SecurityConfig.java
  ├── JwtConfig.java                  →           ├── JwtConfig.java
  └── JwtAuthenticationFilter.java    →           └── JwtAuthenticationFilter.java

infrastructure/adapters/security/     →         auth/infrastructure/security/
  └── PasswordHashingServiceImpl      →           └── PasswordHashingServiceImpl

presentation/controllers/             →         auth/presentation/
  ├── AuthController.java             →           ├── AuthController.java
  └── AccessController.java           →           └── AccessController.java

                                      →         auth/api/ (NEW)
                                      →           ├── AuthFacade.java
                                      →           └── dto/
                                      →               └── UserDTO.java
```

---

### 👤 User Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
                                      →         user/domain/events/ (NEW)
                                      →           ├── UserCreatedEvent.java
                                      →           ├── UserUpdatedEvent.java
                                      →           ├── UserDeletedEvent.java
                                      →           ├── PermissionsAssignedEvent.java
                                      →           └── PermissionsRevokedEvent.java

application/commands/                 →         user/application/commands/
  ├── CreateUserCommand.java          →           ├── CreateUserCommand.java
  └── UpdateUserCommand.java          →           └── UpdateUserCommand.java

application/services/                 →         user/application/services/
  └── UserManagementService.java      →           └── UserManagementService.java

presentation/controllers/             →         user/presentation/
  └── UserController.java             →           └── UserController.java

                                      →         user/api/ (NEW)
                                      →           ├── UserFacade.java
                                      →           └── events/
                                      →               └── UserCreatedEvent.java
```

---

### 📝 Quiz Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/entities/                      →         quiz/domain/
  ├── Quiz.java                       →           ├── Quiz.java
  └── Question.java                   →           └── Question.java

                                      →         quiz/domain/events/ (NEW)
                                      →           ├── QuizCreatedEvent.java
                                      →           ├── QuizUpdatedEvent.java
                                      →           ├── QuizDeletedEvent.java
                                      →           ├── QuizTransitionedToReadyEvent.java
                                      →           ├── QuizArchivedEvent.java
                                      →           ├── QuizSessionActivatedEvent.java
                                      →           ├── QuizSessionDeactivatedEvent.java
                                      →           ├── QuestionAddedEvent.java
                                      →           ├── QuestionUpdatedEvent.java
                                      →           ├── QuestionDeletedEvent.java
                                      →           └── QuestionsReorderedEvent.java

application/commands/                 →         quiz/application/commands/
  ├── CreateQuizCommand.java          →           ├── CreateQuizCommand.java
  ├── UpdateQuizCommand.java          →           ├── UpdateQuizCommand.java
  ├── CreateQuestionCommand.java      →           ├── CreateQuestionCommand.java
  └── UpdateQuestionCommand.java      →           └── UpdateQuestionCommand.java

application/services/                 →         quiz/application/services/
  ├── QuizManagementService.java      →           ├── QuizCommandService.java
  ├── QuizSessionService.java         →           ├── QuizQueryService.java
  └── QuestionManagementService.java  →           ├── QuizSessionService.java
                                      →           ├── QuestionCommandService.java
                                      →           └── QuestionQueryService.java

presentation/controllers/             →         quiz/presentation/
  ├── QuizController.java             →           ├── QuizController.java
  └── QuestionController.java         →           └── QuestionController.java

                                      →         quiz/api/ (NEW)
                                      →           ├── QuizFacade.java
                                      →           ├── dto/
                                      →           │   ├── QuizDTO.java
                                      →           │   └── QuestionDTO.java
                                      →           └── events/
                                      →               └── QuizCreatedEvent.java
```

---

### 👥 Team Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/entities/                      →         team/domain/
  └── Team.java                       →           └── Team.java

                                      →         team/domain/events/ (NEW)
                                      →           ├── TeamRegisteredEvent.java
                                      →           ├── TeamRemovedEvent.java
                                      →           ├── TeamScoreResetEvent.java
                                      →           ├── TeamConnectedEvent.java
                                      →           └── TeamDisconnectedEvent.java

application/services/                 →         team/application/services/
  └── TeamRegistrationService.java    →           ├── TeamCommandService.java
                                      →           └── TeamQueryService.java

presentation/controllers/             →         team/presentation/
  └── TeamController.java             →           └── TeamController.java

                                      →         team/api/ (NEW)
                                      →           ├── TeamFacade.java
                                      →           ├── dto/
                                      →           │   └── TeamDTO.java
                                      →           └── events/
                                      →               └── TeamRegisteredEvent.java
```

---

### ✍️ Submission Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/entities/                      →         submission/domain/
  └── Submission.java                 →           └── Submission.java

                                      →         submission/domain/events/ (NEW)
                                      →           ├── AnswerSubmittedEvent.java
                                      →           ├── SubmissionUpdatedEvent.java
                                      →           ├── SubmissionGradedEvent.java
                                      →           └── AllTeamsSubmittedEvent.java

application/services/                 →         submission/application/services/
  └── SubmissionService.java          →           ├── SubmissionCommandService.java
                                      →           └── SubmissionQueryService.java

                                      →         submission/application/listeners/ (NEW)
                                      →           └── QuestionEventListener.java

presentation/controllers/             →         submission/presentation/
  └── SubmissionController.java       →           └── SubmissionController.java

                                      →         submission/api/ (NEW)
                                      →           ├── SubmissionFacade.java
                                      →           ├── dto/
                                      →           │   └── SubmissionDTO.java
                                      →           └── events/
                                      →               ├── AnswerSubmittedEvent.java
                                      →               └── SubmissionGradedEvent.java
```

---

### 🏆 Scoreboard Module (CQRS)

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
application/services/                 →         scoreboard/application/services/
  └── ScoreboardService.java          →           └── ScoreboardQueryService.java

                                      →         scoreboard/domain/ (NEW)
                                      →           ├── ScoreboardReadModel.java
                                      →           └── ScoreboardEntry.java

                                      →         scoreboard/application/projections/ (NEW)
                                      →           └── ScoreboardProjection.java

presentation/controllers/             →         scoreboard/presentation/
  └── ScoreboardController.java       →           └── ScoreboardController.java

                                      →         scoreboard/api/ (NEW)
                                      →           ├── ScoreboardFacade.java
                                      →           └── dto/
                                      →               └── ScoreboardEntryDTO.java
```

---

### 💾 Backup Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
domain/entities/                      →         backup/domain/
  └── BackupRecord.java               →           └── BackupRecord.java

domain/exceptions/                    →         backup/domain/exceptions/
  ├── BackupException.java            →           ├── BackupException.java
  ├── BackupNotFoundException.java    →           ├── BackupNotFoundException.java
  └── BackupFileNotFoundException     →           └── BackupFileNotFoundException

                                      →         backup/domain/events/ (NEW)
                                      →           ├── BackupCreatedEvent.java
                                      →           ├── BackupRestoredEvent.java
                                      →           └── BackupFailedEvent.java

application/services/                 →         backup/application/services/
  ├── BackupService.java              →           ├── BackupCommandService.java
  └── BackupServiceImpl.java          →           └── BackupQueryService.java

                                      →         backup/application/sagas/ (NEW)
                                      →           └── BackupRestorationSaga.java

                                      →         backup/application/listeners/ (NEW)
                                      →           └── QuizEventListener.java

infrastructure/adapters/              →         backup/infrastructure/persistence/
  └── PostgresBackupExecutorImpl      →           └── PostgresBackupExecutorImpl

infrastructure/config/                →         backup/infrastructure/config/
  ├── BackupProperties.java           →           ├── BackupProperties.java
  └── BackupDirectoryInitializer      →           └── BackupDirectoryInitializer

presentation/controllers/             →         backup/presentation/
  └── BackupController.java           →           └── BackupController.java

                                      →         backup/api/ (NEW)
                                      →           ├── BackupFacade.java
                                      →           ├── dto/
                                      →           │   └── BackupRecordDTO.java
                                      →           └── events/
                                      →               └── BackupCreatedEvent.java
```

---

### 🔴 Realtime Module

```
BEFORE                                          AFTER
─────────────────────────────────────────────────────────────────────
infrastructure/websocket/             →         realtime/infrastructure/websocket/
  ├── QuizWebSocketController.java    →           ├── QuizWebSocketController.java
  ├── WebSocketExceptionHandler.java  →           ├── WebSocketExceptionHandler.java
  ├── GameFlowService.java            →           └── package-info.java
  ├── QuizTimerService.java           →
  ├── AnswerDistributionService.java  →         realtime/application/services/
  ├── GameState.java                  →           ├── BroadcastService.java
  ├── HostCommandType.java            →           ├── GameFlowService.java
  └── dto/                            →           ├── TimerService.java
      ├── GameStateMessage.java       →           ├── SessionManager.java
      ├── TimerMessage.java           →           └── AnswerDistributionService.java
      ├── BufferMessage.java          →
      ├── QuestionPayload.java        →         realtime/domain/
      ├── AnswerRevealPayload.java    →           ├── GameState.java
      ├── AnswerDistribution.java     →           └── HostCommandType.java
      ├── TeamResult.java             →
      ├── TeamInfo.java               →         realtime/infrastructure/dto/
      ├── HostCommand.java            →           ├── GameStateMessage.java
      ├── HostNotification.java       →           ├── TimerMessage.java
      ├── SubmissionMessage.java      →           ├── BufferMessage.java
      └── ErrorMessage.java           →           ├── QuestionPayload.java
                                      →           ├── AnswerRevealPayload.java
infrastructure/config/                →           ├── AnswerDistribution.java
  ├── WebSocketConfig.java            →           ├── TeamResult.java
  ├── WebSocketAuthInterceptor.java   →           ├── TeamInfo.java
  ├── WebSocketEventListener.java     →           ├── HostCommand.java
  ├── QuizBroadcastService.java       →           ├── HostNotification.java
  └── QuizSessionManager.java         →           ├── SubmissionMessage.java
                                      →           └── ErrorMessage.java

                                      →         realtime/infrastructure/websocket/
                                      →           ├── WebSocketConfig.java
                                      →           ├── WebSocketAuthInterceptor.java
                                      →           └── WebSocketEventListener.java

                                      →         realtime/application/listeners/ (NEW)
                                      →           ├── QuizEventListener.java
                                      →           ├── TeamEventListener.java
                                      →           └── SubmissionEventListener.java

                                      →         realtime/api/ (NEW)
                                      →           └── RealtimeFacade.java
```

---

## Quick Reference: File Count by Module

| Module | Domain | Application | Infrastructure | Presentation | API | Total |
|--------|--------|-------------|----------------|--------------|-----|-------|
| **Shared** | 0 | 0 | 0 | 0 | 18 | 18 |
| **Auth** | 2 | 5 | 6 | 2 | 3 | 18 |
| **User** | 0 | 3 | 0 | 1 | 2 | 6 |
| **Quiz** | 2 | 9 | 4 | 2 | 5 | 22 |
| **Team** | 1 | 2 | 2 | 1 | 3 | 9 |
| **Submission** | 1 | 3 | 2 | 1 | 4 | 11 |
| **Scoreboard** | 2 | 2 | 2 | 1 | 2 | 9 |
| **Backup** | 1 | 5 | 4 | 1 | 3 | 14 |
| **Realtime** | 2 | 8 | 17 | 0 | 1 | 28 |
| **TOTAL** | 11 | 37 | 37 | 9 | 41 | 135 |

---

## Migration Effort Estimation

| Module | Complexity | Files to Move | New Files | Estimated Hours |
|--------|-----------|---------------|-----------|-----------------|
| Shared | Low | 18 | 2 | 4 hours |
| Auth | Medium | 15 | 6 | 8 hours |
| User | Low | 4 | 5 | 4 hours |
| Quiz | High | 13 | 14 | 12 hours |
| Team | Low | 5 | 6 | 4 hours |
| Submission | Medium | 6 | 8 | 6 hours |
| Scoreboard | Medium | 3 | 8 | 8 hours |
| Backup | Medium | 9 | 8 | 8 hours |
| Realtime | High | 25 | 6 | 16 hours |
| **TOTAL** | - | **98** | **63** | **70 hours** |

**Total Estimated Time**: 70 hours (approximately 2 weeks for 1 developer, or 1 week for 2 developers)

---

## Color-Coded Priority

🟢 **Low Risk** (Start here)
- Shared Module
- User Module
- Team Module

🟡 **Medium Risk** (Next)
- Auth Module
- Submission Module
- Scoreboard Module
- Backup Module

🔴 **High Risk** (Last)
- Quiz Module (many dependencies)
- Realtime Module (complex WebSocket logic)

---

## Success Criteria Checklist

After migration, verify:

- [ ] All files moved to correct module structure
- [ ] No files remain in old `application/`, `domain/`, `infrastructure/`, `presentation/` packages
- [ ] All modules have `package-info.java` with `@ApplicationModule` annotation
- [ ] All public APIs have `@NamedInterface("api")` annotation
- [ ] All domain events created and published
- [ ] All event listeners created
- [ ] All facades created
- [ ] Spring Modulith verification passes: `ApplicationModules.of(App.class).verify()`
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No circular dependencies between modules
- [ ] Documentation updated

---

## Rollback Plan

If migration fails at any phase:

1. **Revert to previous commit** (use Git)
2. **Identify the issue** (check logs, tests)
3. **Fix the issue** in isolation
4. **Re-run the phase**
5. **Continue migration**

**Important**: Commit after each successful phase!

---

## Next Steps

1. ✅ Review this visual reference
2. ✅ Understand file movements
3. ✅ Start with Shared Module (lowest risk)
4. ✅ Follow the migration checklist
5. ✅ Test after each module
6. ✅ Commit after each successful phase

**Ready to start? Begin with the Shared Module!**
