# IntelliQuiz — Spring Modulith Migration Plan

## Table of Contents

- [1. Requirements](#1-requirements)
  - [1.1 Background & Motivation](#11-background--motivation)
    - [1.1.1 What Is IntelliQuiz?](#111-what-is-intelliquiz)
    - [1.1.2 Why This Architecture? (DDD + Clean Architecture + EDA + Selective CQRS/Saga)](#112-why-this-architecture)
  - [1.2 Current State Assessment](#12-current-state-assessment)
    - [1.2.1 Technology Stack](#121-technology-stack)
    - [1.2.2 Current Package Structure](#122-current-package-structure)
    - [1.2.3 Cross-Module Dependency Matrix](#123-cross-module-dependency-matrix)
    - [1.2.4 Coupling Hotspots](#124-coupling-hotspots)
    - [1.2.5 Anti-Patterns to Resolve](#125-anti-patterns-to-resolve)
  - [1.3 Functional Requirements](#13-functional-requirements)
    - [FR-1: Module Decomposition with Internal Clean Architecture](#fr-1-module-decomposition-with-internal-clean-architecture)
    - [FR-2: Module Boundary Enforcement](#fr-2-module-boundary-enforcement)
    - [FR-2.1: Clean Architecture Layer Rules (Within Each Module)](#fr-21-clean-architecture-layer-rules-within-each-module)
    - [FR-3: Module Dependency Rules](#fr-3-module-dependency-rules)
    - [FR-4: API Preservation](#fr-4-api-preservation)
    - [FR-5: Per-Module Content Allocation (4-Layer Clean Architecture)](#fr-5-per-module-content-allocation)
    - [FR-6: Clean Architecture + EDA Integration Rules](#fr-6-clean-architecture--eda-integration-rules)
    - [FR-7: Global Exception Handling](#fr-7-global-exception-handling)
    - [FR-8: Entity Ownership and Cross-Module Access](#fr-8-entity-ownership-and-cross-module-access)
    - [FR-9: DDD Tactical Patterns per Module](#fr-9-ddd-tactical-patterns-per-module)
    - [FR-10: CQRS for Scoreboard Module](#fr-10-cqrs-for-scoreboard-module)
    - [FR-11: Saga Pattern for Complex Workflows](#fr-11-saga-pattern-for-complex-workflows)
  - [1.4 Non-Functional Requirements](#14-non-functional-requirements)
  - [1.5 Module Inventory Requirements (Template)](#15-module-inventory-requirements)
  - [1.6 Cross-Cutting Concerns](#16-cross-cutting-concerns)
  - [1.7 Dependency & Coupling Requirements](#17-dependency--coupling-requirements)
  - [1.8 Event-Driven Communication Requirements](#18-event-driven-communication-requirements)
  - [1.9 Testing Requirements](#19-testing-requirements)
  - [1.10 Migration Constraints](#110-migration-constraints)
  - [1.11 Acceptance Criteria](#111-acceptance-criteria)
- [2. Design](#2-design)
  - [2.1 Target Architecture Overview](#21-target-architecture-overview)
    - [2.1.1 High-Level Module Topology](#211-high-level-module-topology)
    - [2.1.2 Module Dependency Graph](#212-module-dependency-graph-directed-acyclic)
    - [2.1.3 Intra-Module Architecture (4-Layer Clean Architecture)](#213-intra-module-architecture-4-layer-clean-architecture)
  - [2.2 Module Design](#22-module-design)
    - [2.2.1 Shared Module Design](#221-shared-module-design)
    - [2.2.2 Auth Module Design](#222-auth-module-design)
    - [2.2.3 Quiz Module Design](#223-quiz-module-design)
    - [2.2.4 User Module Design](#224-user-module-design)
    - [2.2.5 Team Module Design](#225-team-module-design)
    - [2.2.6 Submission Module Design](#226-submission-module-design)
    - [2.2.7 Scoreboard Module Design (CQRS)](#227-scoreboard-module-design-cqrs)
    - [2.2.8 Backup Module Design (Saga)](#228-backup-module-design-saga)
    - [2.2.9 Realtime Module Design (Saga + Event Consumer)](#229-realtime-module-design-saga--event-consumer)
  - [2.3 Event Flow Design](#23-event-flow-design)
    - [2.3.1 Complete Event Flow Map](#231-complete-event-flow-map)
    - [2.3.2 Synchronous vs Asynchronous Event Decisions](#232-synchronous-vs-asynchronous-event-decisions)
  - [2.4 Cross-Cutting Design](#24-cross-cutting-design)
    - [2.4.1 JPA Entity Relationship Migration Plan](#241-jpa-entity-relationship-migration-plan)
    - [2.4.2 Security Filter Chain Design](#242-security-filter-chain-design)
    - [2.4.3 Global Exception Handler Design](#243-global-exception-handler-design)
    - [2.4.4 Database Schema Changes](#244-database-schema-changes)
  - [2.5 Testing Design](#25-testing-design)
    - [2.5.1 Module Verification Test](#251-module-verification-test)
    - [2.5.2 Per-Module Integration Test Template](#252-per-module-integration-test-template)
    - [2.5.3 CQRS Projection Test](#253-cqrs-projection-test)
- [3. Implementation](#3-implementation)
  - [3.1 Phase 0 — Pre-Migration Cleanup](#31-phase-0--pre-migration-cleanup)
  - [3.2 Phase 1 — Extract Shared Module](#32-phase-1--extract-shared-module)
  - [3.3 Phase 2 — Extract Auth Module](#33-phase-2--extract-auth-module)
  - [3.4 Phase 3 — Extract Quiz Module](#34-phase-3--extract-quiz-module)
  - [3.5 Phase 4 — Extract User Module](#35-phase-4--extract-user-module)
  - [3.6 Phase 5 — Extract Team Module](#36-phase-5--extract-team-module)
  - [3.7 Phase 6 — Extract Submission Module](#37-phase-6--extract-submission-module)
  - [3.8 Phase 7 — Extract Scoreboard Module (CQRS)](#38-phase-7--extract-scoreboard-module-cqrs)
  - [3.9 Phase 8 — Extract Backup Module](#39-phase-8--extract-backup-module)
  - [3.10 Phase 9 — Extract Realtime Module](#310-phase-9--extract-realtime-module)
  - [3.11 Phase 10 — Validation & Finalization](#311-phase-10--validation--finalization)
  - [3.12 Migration Timeline Summary](#312-migration-timeline-summary)

---

## 1. Requirements

### 1.1 Background & Motivation

#### 1.1.1 What Is IntelliQuiz?

IntelliQuiz is a real-time quiz hosting platform built with Spring Boot 3.2.5 and Java 21. The backend provides:

- **User management** — Super-admin and admin roles with granular per-quiz permissions (`CAN_VIEW_DETAILS`, `CAN_EDIT_CONTENT`, `CAN_MANAGE_TEAMS`, `CAN_HOST_GAME`)
- **Quiz lifecycle** — CRUD for quizzes and questions with state machine (`DRAFT → READY → ARCHIVED`)
- **Real-time game sessions** — WebSocket-powered live quiz hosting with server-authoritative timers, lobby/buffer/active/grading/reveal state flow
- **Team participation** — Team registration via access codes, answer submissions, auto-grading
- **Scoreboard** — Live leaderboard computed from graded submissions
- **Database backup** — Full PostgreSQL backup/restore via `pg_dump`/`psql`
- **JWT authentication** — Stateless API security with Spring Security

#### 1.1.2 Why This Architecture?

The target architecture is a **Hybrid Multi-Pattern Architecture** — a practical, middle-ground design that combines well-proven patterns where each one adds clear value, without over-engineering.

**Pattern Composition:**

| Pattern | Weight | Role | Where Applied |
|---|---|---|---|
| **Domain-Driven Design (DDD)** | Foundation (70%) | Rich domain models with aggregate boundaries, value objects, domain events, ubiquitous language | All 8 business modules |
| **Spring Modulith** | Structure | Enforces **module boundaries** between bounded contexts at compile/test time | All 9 modules |
| **Clean Architecture (4 layers)** | Internal | Enforces the **dependency rule** within each module — outer layers depend on inner, never reverse | All 8 business modules |
| **Event-Driven Architecture (EDA)** | Communication (20%) | Replaces direct cross-module service calls with **application events** | Inter-module communication |
| **CQRS** | Selective (5%) | Separates read/write models for the read-heavy scoreboard | Scoreboard module **only** |
| **Saga** | Selective (3%) | Orchestrates multi-step workflows with compensation | Quiz activation + Backup restore **only** |

> **Design Principle:** Apply the simplest pattern that solves the problem. DDD + Clean Architecture + EDA are universal. CQRS and Saga are applied **only** where they provide measurable benefit — not everywhere.

**Problems with the current architecture and how this combination solves them:**

| Problem with Current Architecture | How the Hybrid Architecture Solves It |
|---|---|
| Layered packages organize by **technical concern**, not by **business capability** | **DDD bounded contexts** define modules by business domain (auth, quiz, team, etc.) — each module owns its 4-layer Clean Architecture stack |
| No enforcement of architectural boundaries | **Spring Modulith** `ApplicationModules.verify()` fails the build on illegal access; **Clean Architecture** ensures inner layers are never dependent on outer layers |
| Cross-aggregate coupling is invisible (e.g., `GameFlowService` injects 8 beans spanning 4 aggregates) | **DDD aggregates** define clear consistency boundaries; **EDA** decouples cross-module communication; module dependencies are declared explicitly |
| Domain entities are anemic or mixed with infrastructure concerns | **DDD rich domain models** — entities enforce their own invariants (e.g., `Quiz.activate()` checks state); domain layer stays pure via Clean Architecture's Dependency Rule |
| Adding a feature requires touching files across 4+ packages | A new feature lives within one module. **DDD ubiquitous language** keeps naming consistent between code and business concepts |
| No asynchronous, decoupled module communication | **EDA** via Spring Modulith's `ApplicationEventPublisher` + `@ApplicationModuleListener` |
| Scoreboard queries are slow (join across Team + Submission) | **CQRS read model** in scoreboard module — denormalized, pre-computed rankings, event-synced |
| Quiz activation / backup restore are multi-step with no rollback | **Saga pattern** orchestrates steps with compensating transactions on failure |
| Testing in isolation is difficult | **DDD** allows unit-testing domain logic with zero Spring context; `@ApplicationModuleTest` bootstraps only the target module |

#### 1.1.3 Current Migration State

The migration has been **started but is incomplete**:

| Item | Status |
|---|---|
| Spring Modulith BOM `1.2.3` added to `pom.xml` | ✅ Done |
| `spring-modulith-starter-core` dependency | ✅ Done |
| `spring-modulith-starter-test` dependency (test scope) | ✅ Done |
| Skeletal `auth/` module folder with `package-info.java` | ⚠️ Scaffolded but empty (no `@ApplicationModule`, no code moved) |
| `auth/internal/` subfolder with `.gitkeep` + empty `package-info.java` files | ⚠️ Scaffolded but empty |
| All business code still in original layered structure | ❌ Not migrated |
| No module verification tests | ❌ Missing |
| No Spring application events defined | ❌ Missing |
| No module facade/API classes | ❌ Missing |

---

### 1.2 Current State Assessment

#### 1.2.1 Codebase Metrics

| Metric | Value |
|---|---|
| Total Java source files | 109 + 4 `package-info.java` = 113 |
| JPA entities | 7 (`User`, `Quiz`, `Question`, `QuizAssignment`, `Team`, `Submission`, `BackupRecord`) |
| Domain enums | 6 (`SystemRole`, `AdminPermission`, `QuizStatus`, `QuestionType`, `Difficulty`, `BackupStatus`) |
| Domain exceptions | 11 (1 base + 7 domain + 3 backup-specific) |
| Repository ports (interfaces) | 9 (`UserRepository`, `QuizRepository`, `QuestionRepository`, etc.) |
| Repository adapters (impl) | 6 bridging port → Spring Data JPA |
| Spring Data JPA interfaces | 7 (6 `Spring*Repository` + `BackupRecordRepository` direct) |
| Application services | 12 (including `BackupServiceImpl`) |
| REST controllers | 9 |
| WebSocket services | 5 (`GameFlowService`, `QuizTimerService`, `AnswerDistributionService`, `QuizBroadcastService`, `QuizSessionManager`) |
| WebSocket DTOs | 12 record types |
| Configuration classes | 12 |
| Request/Response DTOs | 23 records |
| Test classes | 40+ (property-based tests with jqwik + JUnit 5) |

#### 1.2.2 Current Package Structure

```
com.intelliquiz.api
├── IntelliQuizApiApplication.java       ← @SpringBootApplication (scan root)
├── EnvInitializer.java
│
├── application/                         ← USE CASES (commands + services)
│   ├── commands/                        (6 command records)
│   └── services/                        (12 services + 2 result records + 1 enum)
│
├── domain/                              ← CORE DOMAIN
│   ├── entities/                        (7 JPA entities)
│   ├── enums/                           (6 enums)
│   ├── exceptions/                      (11 exception classes)
│   ├── ports/                           (9 repository/service port interfaces)
│   └── services/                        (1 CodeGenerationService)
│
├── infrastructure/                      ← ADAPTERS & CONFIG
│   ├── adapters/
│   │   ├── PostgresBackupExecutorImpl
│   │   ├── security/BCryptPasswordHashingService
│   │   └── persistence/
│   │       ├── impl/   (6 repository adapters)
│   │       └── spring/ (6 Spring Data JPA interfaces)
│   ├── config/                          (12 config/security/websocket beans)
│   └── websocket/                       (7 services + 12 DTOs)
│
├── presentation/                        ← REST API
│   ├── controllers/                     (9 controllers)
│   ├── dto/
│   │   ├── request/                     (12 request records)
│   │   └── response/                    (10 response records)
│   └── exception/GlobalExceptionHandler
│
└── auth/                                ← PARTIALLY SCAFFOLDED MODULE
    ├── package-info.java                (empty)
    └── internal/
        ├── package-info.java            (empty)
        ├── .gitkeep
        └── presentation/
            ├── controllers/package-info.java  (empty)
            └── dto/package-info.java          (empty)
```

#### 1.2.3 Cross-Aggregate Dependency Matrix

This matrix shows which domain aggregates each service accesses (R = reads, W = writes):

| Service | User | Quiz | Question | Team | Submission | QuizAssignment | BackupRecord |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `AuthenticationService` | R | | | | | | |
| `AuthorizationService` | R | R | | | | (via User) | |
| `QuizManagementService` | | RW | | | | | |
| `QuestionManagementService` | | R | RW | | | | |
| `QuizSessionService` | | RW | | | | | |
| `TeamRegistrationService` | | R | | RW | | | |
| `SubmissionService` | | | R | RW | RW | | |
| `ScoreboardService` | | R | | R | | | |
| `AccessResolutionService` | | R | | R | | | |
| `UserManagementService` | RW | R | | | | RW | |
| `BackupServiceImpl` | R | | | | | | RW |
| **`GameFlowService`** | | **R** | **R** | **RW** | **RW** | | |

#### 1.2.4 Coupling Hotspots Identified

| Risk Level | Component | Issue |
|---|---|---|
| 🔴 Critical | `GameFlowService` | 8 constructor dependencies, 4 domain repositories, orchestrates entire real-time game loop |
| 🟠 High | `UserManagementService` | Bridges User ↔ Quiz via `QuizAssignment` join entity; 4 repository dependencies |
| 🟠 High | `SubmissionService` | 3-way coupling: Team ↔ Question ↔ Submission |
| 🟡 Medium | `AuthorizationService` | Navigates `User.getAssignments()` → `QuizAssignment` → Quiz (crosses bounded contexts) |
| 🟡 Medium | `AccessResolutionService` | Reads Team + Quiz aggregates to resolve access codes |
| 🟢 Low | `AuthenticationService` | Single aggregate (User only) — cleanly isolated |
| 🟢 Low | `QuizManagementService` | Single aggregate (Quiz only) — cleanly isolated |
| 🟢 Low | `BackupServiceImpl` | Self-contained (BackupRecord + infrastructure) |

#### 1.2.5 Architectural Anti-Patterns to Fix

| # | Anti-Pattern | Location | Required Fix |
|---|---|---|---|
| AP-1 | **Leaky abstraction** — `BackupRecordRepository` extends `JpaRepository` directly in the `domain.ports` package | [BackupRecordRepository.java](backend/src/main/java/com/intelliquiz/api/domain/ports/BackupRecordRepository.java) | Create a clean port interface + adapter, matching the pattern used by the other 6 repositories |
| AP-2 | **Domain entity as API response** — Controllers return `Quiz`, `Question`, `Team` entities directly (mapped via `from()` factory methods in the DTOs but entities still leak to controllers) | Presentation controllers | Ensure controllers only work with module-specific DTOs; entities never cross module boundaries |
| AP-3 | **Misplaced services in config package** — `QuizBroadcastService` and `QuizSessionManager` are annotated `@Service` but live under `infrastructure.config` | [QuizBroadcastService](backend/src/main/java/com/intelliquiz/api/infrastructure/config/QuizBroadcastService.java), [QuizSessionManager](backend/src/main/java/com/intelliquiz/api/infrastructure/config/QuizSessionManager.java) | Move to proper module (`realtime` module) |
| AP-4 | **God orchestrator** — `GameFlowService` directly calls 4 repositories + 4 services | [GameFlowService](backend/src/main/java/com/intelliquiz/api/infrastructure/websocket/GameFlowService.java) | Decompose into event-driven coordination; delegate to per-module APIs |
| AP-5 | **`@Service` on domain service** — `CodeGenerationService` has Spring `@Service` annotation in domain layer | [CodeGenerationService](backend/src/main/java/com/intelliquiz/api/domain/services/CodeGenerationService.java) | Move to shared module; keep annotation (acceptable in Modulith since Spring manages all modules) |

---

### 1.3 Functional Requirements

#### FR-1: Module Decomposition with Internal Clean Architecture

The monolithic layered codebase **SHALL** be reorganized into the following 9 Spring Modulith application modules. **Each module SHALL internally follow Clean Architecture with 4 layers** (Domain → Application → Infrastructure → Presentation) **with DDD tactical patterns** in the domain layer, ensuring the codebase is maintainable at both the module boundary level and the internal implementation level.

| Module | Package | Bounded Context | EDA Role | DDD Pattern | Special Pattern |
|---|---|---|---|---|---|
| **shared** | `com.intelliquiz.api.shared` | Common types, exceptions, enums, utilities | N/A | Value Objects, Shared Kernel | — |
| **auth** | `com.intelliquiz.api.auth` | Authentication, authorization, JWT, security config | Consumer | Value Objects, Domain Services | — |
| **user** | `com.intelliquiz.api.user` | Admin account lifecycle and quiz permission assignments | Producer | Aggregate Root (`User`), Entity (`QuizAssignment`) | — |
| **quiz** | `com.intelliquiz.api.quiz` | Quiz + question CRUD, state machine, session activation | Producer | Aggregate Root (`Quiz`), Entity (`Question`), Value Objects | — |
| **team** | `com.intelliquiz.api.team` | Team registration and access code management | Producer | Aggregate Root (`Team`), Value Objects (`AccessCode`) | — |
| **submission** | `com.intelliquiz.api.submission` | Answer submission and auto-grading | Producer + Consumer | Aggregate Root (`Submission`) | — |
| **scoreboard** | `com.intelliquiz.api.scoreboard` | Live leaderboard computation | Consumer | Read Model (denormalized view) | **CQRS** |
| **backup** | `com.intelliquiz.api.backup` | PostgreSQL backup/restore operations | Producer | Aggregate Root (`BackupRecord`) | **Saga** (restore workflow) |
| **realtime** | `com.intelliquiz.api.realtime` | WebSocket game session orchestration | Consumer | Domain Services, Value Objects (`GameState`) | **Saga** (quiz activation) |

#### FR-2: Module Boundary Enforcement

- Each module **SHALL** have a `package-info.java` annotated with `@ApplicationModule` declaring its `displayName` and `allowedDependencies`.
- Internal implementation classes **SHALL** reside under an `internal` sub-package to prevent external access.
- Each module **SHALL** expose a public API (facade class, events, and DTOs) in the module's root package or a dedicated `api` sub-package.

#### FR-2.1: Clean Architecture Layer Rules (Within Each Module)

Every module (except `shared`) **SHALL** contain 4 internal layers with strict dependency direction:

```
┌─────────────────────────────────────────────────────────┐
│                   MODULE BOUNDARY                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  4. PRESENTATION LAYER (outermost)                  │ │
│  │     Controllers, Request/Response DTOs               │ │
│  │     ↓ depends on                                     │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  3. INFRASTRUCTURE LAYER                            │ │
│  │     Repository adapters, Spring Data JPA,            │ │
│  │     Config, External service adapters                │ │
│  │     ↓ depends on                                     │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  2. APPLICATION LAYER                               │ │
│  │     Use case services, Commands, Event handlers,     │ │
│  │     ApplicationEventPublisher (EDA)                  │ │
│  │     ↓ depends on                                     │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  1. DOMAIN LAYER (innermost — zero dependencies)    │ │
│  │     Entities, Value Objects, Domain Services,        │ │
│  │     Repository Port interfaces, Domain exceptions    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**The Dependency Rule — dependencies ONLY point inward:**

| Layer | May Depend On | Must NOT Depend On |
|---|---|---|
| **Domain** (innermost) | Nothing (pure Java; no Spring, no JPA imports) | Application, Infrastructure, Presentation |
| **Application** | Domain | Infrastructure, Presentation |
| **Infrastructure** | Domain, Application | Presentation |
| **Presentation** (outermost) | Application (for use case invocation), Domain (for shared types only) | Infrastructure directly (uses application layer as mediator) |

**Layer responsibilities:**

| Layer | Responsibility | Allowed Annotations |
|---|---|---|
| **Domain** | **DDD Aggregate Roots** with business invariants, **child entities** within aggregate boundaries, **value objects** (immutable, identity-less types), **repository port interfaces** (one per aggregate root), **domain services** (stateless business logic operating on multiple aggregates), **domain exceptions** | None (pure Java) — JPA annotations are a pragmatic exception documented in [CC-6](#cc-6-jpa-annotations-on-domain-entities) |
| **Application** | Orchestrate use cases by calling domain aggregates and repository ports; publish **application events** (EDA) via `ApplicationEventPublisher`; handle incoming events via `@ApplicationModuleListener`; map between presentation DTOs and domain commands | `@Service`, `@Transactional`, `@ApplicationModuleListener` |
| **Infrastructure** | Implement **repository ports** (adapters), Spring Data JPA interfaces, external service clients, configuration beans | `@Component`, `@Repository`, `@Configuration`, `@ConfigurationProperties` |
| **Presentation** | HTTP/WebSocket endpoints, request validation, response mapping; translates external input into application-layer commands | `@RestController`, `@Controller`, `@RequestMapping`, `@MessageMapping` |

#### FR-3: Module Dependency Rules

The following directed dependency graph **SHALL** be enforced (no cycles allowed):

```
shared ← auth ← user
                ↑
shared ← quiz ← team ← submission ← scoreboard
                 ↑
shared ← backup  ↓
         realtime (depends on: shared, quiz, team, submission)
```

Explicit allowed dependencies per module:

| Module | Allowed Dependencies |
|---|---|
| `shared` | *(none)* |
| `auth` | `shared` |
| `quiz` | `shared`, `auth` |
| `user` | `shared`, `auth`, `quiz` |
| `team` | `shared`, `quiz` |
| `submission` | `shared`, `quiz`, `team` |
| `scoreboard` | `shared`, `team`, `submission` |
| `backup` | `shared`, `auth` |
| `realtime` | `shared`, `quiz`, `team`, `submission` |

#### FR-4: API Preservation

- All existing REST API endpoints **SHALL** continue to function identically after migration.
- HTTP routes, request/response schemas, status codes, and error formats **SHALL NOT** change.
- WebSocket message contracts (STOMP destinations, payload shapes) **SHALL NOT** change.
- JWT authentication and authorization behavior **SHALL NOT** change.
- No frontend changes **SHALL** be required.

#### FR-5: Per-Module Content Allocation

##### FR-5.1 — Shared Module (Foundation — No Clean Architecture Layers)

The shared module is a **flat utility module** — it does not follow the 4-layer pattern because it has no use cases, no controllers, and no persistence. It simply provides types consumed by all other modules.

```
com.intelliquiz.api.shared/
├── package-info.java
├── exceptions/
│   ├── DomainException.java
│   ├── EntityNotFoundException.java
│   ├── AuthenticationFailedException.java
│   ├── AuthorizationException.java
│   ├── DuplicateSubmissionException.java
│   ├── InvalidAccessCodeException.java
│   ├── InvalidQuizStateException.java
│   ├── QuizNotReadyException.java
│   ├── BackupException.java
│   ├── BackupFileNotFoundException.java
│   └── BackupNotFoundException.java
├── enums/
│   ├── SystemRole.java
│   ├── AdminPermission.java
│   ├── QuizStatus.java
│   ├── QuestionType.java
│   ├── Difficulty.java
│   ├── BackupStatus.java
│   └── RouteType.java
├── services/
│   └── CodeGenerationService.java
├── dto/
│   └── ErrorResponse.java
└── exception/
    └── GlobalExceptionHandler.java
```

##### FR-5.2 — Auth Module (4-Layer Clean Architecture)

```
com.intelliquiz.api.auth/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared"})
├── AuthFacade.java                            ← PUBLIC API
├── events/                                    ← PUBLIC (consumed by other modules)
│   └── (no outbound events — auth is a consumer)
├── dto/                                       ← PUBLIC cross-module DTOs
│   ├── AuthenticationResultDto.java
│   └── AccessResolutionResultDto.java
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN (innermost)
    │   └── ports/
    │       └── PasswordHashingService.java     (interface)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   └── services/
    │       ├── AuthenticationService.java
    │       ├── AuthorizationService.java
    │       ├── AccessResolutionService.java
    │       ├── AuthenticationResult.java       (internal result record)
    │       └── AccessResolutionResult.java     (internal result record)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   ├── security/
    │   │   └── BCryptPasswordHashingService.java  (implements PasswordHashingService port)
    │   └── config/
    │       ├── JwtConfig.java
    │       ├── JwtAuthenticationFilter.java
    │       ├── SecurityConfig.java
    │       ├── CorsConfig.java
    │       └── OpenApiConfig.java
    │
    └── presentation/                          ← LAYER 4: PRESENTATION (outermost)
        ├── controllers/
        │   ├── AuthController.java
        │   └── AccessController.java
        └── dto/
            ├── request/
            │   ├── LoginRequest.java
            │   └── AccessCodeRequest.java
            └── response/
                ├── AuthResponse.java
                └── AccessResolutionResponse.java
```

**EDA role:** Consumer — listens for `PermissionsAssignedEvent` and `PermissionsRevokedEvent` from the `user` module to refresh authorization caches.

##### FR-5.3 — User Module (4-Layer Clean Architecture + EDA Producer)

```
com.intelliquiz.api.user/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","auth","quiz"})
├── UserFacade.java                            ← PUBLIC API
├── events/                                    ← PUBLIC outbound events
│   ├── UserCreatedEvent.java
│   ├── UserUpdatedEvent.java
│   ├── UserDeletedEvent.java
│   ├── PermissionsAssignedEvent.java
│   └── PermissionsRevokedEvent.java
├── dto/                                       ← PUBLIC cross-module DTOs
│   └── UserPermissionsDto.java
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   ├── User.java
    │   │   └── QuizAssignment.java
    │   └── ports/
    │       ├── UserRepository.java             (interface)
    │       └── QuizAssignmentRepository.java   (interface)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   ├── services/
    │   │   └── UserManagementService.java      (publishes events via ApplicationEventPublisher)
    │   └── commands/
    │       ├── CreateUserCommand.java
    │       └── UpdateUserCommand.java
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── persistence/
    │       ├── UserRepositoryImpl.java         (implements UserRepository port)
    │       ├── QuizAssignmentRepositoryImpl.java
    │       ├── SpringUserRepository.java       (Spring Data JPA)
    │       └── SpringQuizAssignmentRepository.java
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── UserController.java
        └── dto/
            ├── request/
            │   ├── CreateUserRequest.java
            │   ├── UpdateUserRequest.java
            │   └── AssignPermissionsRequest.java
            └── response/
                ├── UserResponse.java
                └── QuizAssignmentResponse.java
```

**EDA role:** Producer — publishes `UserCreatedEvent`, `PermissionsAssignedEvent`, `PermissionsRevokedEvent` from `UserManagementService` via `ApplicationEventPublisher`.

##### FR-5.4 — Quiz Module (4-Layer Clean Architecture + EDA Producer)

```
com.intelliquiz.api.quiz/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","auth"})
├── QuizFacade.java                            ← PUBLIC API (read-only quiz/question info for other modules)
├── events/                                    ← PUBLIC outbound events
│   ├── QuizCreatedEvent.java
│   ├── QuizStatusChangedEvent.java
│   ├── QuizSessionActivatedEvent.java
│   ├── QuizSessionDeactivatedEvent.java
│   ├── QuestionAddedEvent.java
│   └── QuestionDeletedEvent.java
├── dto/                                       ← PUBLIC cross-module DTOs
│   ├── QuizInfoDto.java                       (read-only quiz summary for other modules)
│   └── QuestionInfoDto.java                   (read-only question data for grading)
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   ├── Quiz.java                      ★ AGGREGATE ROOT (state machine: DRAFT→READY→ARCHIVED)
    │   │   └── Question.java                  (child entity — accessed only through Quiz)
    │   ├── valueobjects/
    │   │   └── QuizSession.java               (value object — encapsulates isLive + accessCode + proctorPin)
    │   └── ports/
    │       ├── QuizRepository.java             (interface — one per Aggregate Root)
    │       └── QuestionRepository.java         (interface — pragmatic: allows direct question queries)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   ├── services/
    │   │   ├── QuizManagementService.java      (publishes QuizCreated, QuizStatusChanged events)
    │   │   ├── QuestionManagementService.java  (publishes QuestionAdded, QuestionDeleted events)
    │   │   └── QuizSessionService.java         (publishes SessionActivated/Deactivated events)
    │   └── commands/
    │       ├── CreateQuizCommand.java
    │       ├── UpdateQuizCommand.java
    │       ├── CreateQuestionCommand.java
    │       └── UpdateQuestionCommand.java
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── persistence/
    │       ├── QuizRepositoryImpl.java         (implements QuizRepository port)
    │       ├── QuestionRepositoryImpl.java
    │       ├── SpringQuizRepository.java       (Spring Data JPA)
    │       └── SpringQuestionRepository.java
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   ├── QuizController.java
        │   └── QuestionController.java
        └── dto/
            ├── request/
            │   ├── CreateQuizRequest.java
            │   ├── UpdateQuizRequest.java
            │   ├── CreateQuestionRequest.java
            │   ├── UpdateQuestionRequest.java
            │   └── ReorderQuestionsRequest.java
            └── response/
                ├── QuizResponse.java
                └── QuestionResponse.java
```

**EDA role:** Producer — publishes 6 event types from application services. The `QuizFacade` also exposes synchronous read-only methods (e.g., `getQuizInfo(quizId)`, `getQuestionForGrading(questionId)`) consumed by `team`, `submission`, `scoreboard`, and `realtime` modules.

**DDD notes:** `Quiz` is the **Aggregate Root** — all state transitions (`activate()`, `deactivate()`, `transitionToReady()`) are enforced as domain invariants on the entity itself. `Question` is a **child entity** within the Quiz aggregate. `QuizSession` is a **value object** encapsulating live session state.

##### FR-5.5 — Team Module (4-Layer Clean Architecture + EDA Producer)

```
com.intelliquiz.api.team/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","quiz"})
├── TeamFacade.java                            ← PUBLIC API
├── events/                                    ← PUBLIC outbound events
│   ├── TeamRegisteredEvent.java
│   ├── TeamRemovedEvent.java
│   └── TeamScoreResetEvent.java
├── dto/                                       ← PUBLIC cross-module DTOs
│   └── TeamInfoDto.java                       (read-only team info for other modules)
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   └── Team.java                      ★ AGGREGATE ROOT
    │   ├── valueobjects/
    │   │   └── AccessCode.java                (value object — wraps String, validates format)
    │   └── ports/
    │       └── TeamRepository.java             (interface)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   └── services/
    │       └── TeamRegistrationService.java    (publishes TeamRegistered, TeamRemoved events)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── persistence/
    │       ├── TeamRepositoryImpl.java         (implements TeamRepository port)
    │       └── SpringTeamRepository.java       (Spring Data JPA)
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── TeamController.java
        └── dto/
            ├── request/
            │   └── CreateTeamRequest.java
            └── response/
                └── TeamResponse.java
```

**EDA role:** Producer — publishes `TeamRegisteredEvent`, `TeamRemovedEvent` from `TeamRegistrationService`.

**DDD notes:** `Team` is the **Aggregate Root**. `AccessCode` is a **value object** — a Java `record` that validates format on construction and encapsulates access code generation logic.

##### FR-5.6 — Submission Module (4-Layer Clean Architecture + EDA Producer & Consumer)

```
com.intelliquiz.api.submission/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","quiz","team"})
├── SubmissionFacade.java                      ← PUBLIC API
├── events/                                    ← PUBLIC outbound events
│   ├── AnswerSubmittedEvent.java
│   └── SubmissionGradedEvent.java
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   └── Submission.java                ★ AGGREGATE ROOT (enforces grading invariants)
    │   ├── valueobjects/
    │   │   └── Score.java                     (value object — wraps int, validates range)
    │   └── ports/
    │       └── SubmissionRepository.java       (interface)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   ├── services/
    │   │   └── SubmissionService.java          (publishes AnswerSubmitted, SubmissionGraded events)
    │   └── listeners/
    │       └── SubmissionEventListener.java    (handles QuestionDeletedEvent, TeamRemovedEvent)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── persistence/
    │       ├── SubmissionRepositoryImpl.java   (implements SubmissionRepository port)
    │       └── SpringSubmissionRepository.java (Spring Data JPA)
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── SubmissionController.java
        └── dto/
            ├── request/
            │   └── SubmitAnswerRequest.java
            └── response/
                └── SubmissionResponse.java
```

**EDA role:** Producer + Consumer — publishes `AnswerSubmittedEvent`/`SubmissionGradedEvent`; listens for `QuestionDeletedEvent` (cleanup) and `TeamRemovedEvent` (cleanup) via `SubmissionEventListener`.

##### FR-5.7 — Scoreboard Module (4-Layer Clean Architecture + **CQRS** + EDA Consumer)

The scoreboard module is the **only module** that uses CQRS. It maintains a **denormalized read model** synced via events, enabling fast leaderboard queries without joining across Team + Submission tables.

```
com.intelliquiz.api.scoreboard/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","team","submission"})
├── ScoreboardFacade.java                      ← PUBLIC API (query-only — no write commands exposed)
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   └── ScoreboardEntry.java            ★ READ MODEL ENTITY (denormalized: teamId, teamName, quizId, totalScore, rank)
    │   └── ports/
    │       └── ScoreboardReadRepository.java   (interface — query-optimized, NOT a full CRUD repo)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   ├── query/
    │   │   └── ScoreboardQueryService.java     (reads from denormalized ScoreboardEntry — fast queries)
    │   └── listeners/
    │       └── ScoreboardProjection.java       (EVENT HANDLER — syncs read model from SubmissionGradedEvent, TeamScoreResetEvent)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── persistence/
    │       ├── ScoreboardReadRepositoryImpl.java  (implements ScoreboardReadRepository port)
    │       └── SpringScoreboardReadRepository.java (Spring Data JPA — queries on denormalized table)
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── ScoreboardController.java
        └── dto/
            └── response/
                └── ScoreboardResponse.java    (includes nested entry list with rank, teamName, score)
```

**CQRS pattern:**
- **Write side:** Handled by the `submission` module (grading updates team scores).
- **Read side:** `ScoreboardQueryService` reads from a denormalized `ScoreboardEntry` table — no joins, pre-calculated ranks.
- **Sync mechanism:** `ScoreboardProjection` listens for `SubmissionGradedEvent` and `TeamScoreResetEvent`, updates the read model, and recalculates rankings.
- **Consistency:** Eventual consistency (< 1 second lag) — acceptable for a leaderboard.

**EDA role:** Consumer — `ScoreboardProjection` listens for `SubmissionGradedEvent` and `TeamScoreResetEvent` to keep the read model up to date.

##### FR-5.8 — Backup Module (4-Layer Clean Architecture + EDA Producer)

```
com.intelliquiz.api.backup/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","auth"})
├── BackupFacade.java                          ← PUBLIC API
├── events/                                    ← PUBLIC outbound events
│   ├── BackupCreatedEvent.java
│   └── BackupRestoredEvent.java
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── entities/
    │   │   └── BackupRecord.java              ★ AGGREGATE ROOT
    │   └── ports/
    │       ├── BackupRecordRepository.java     (clean interface — NOT extending JpaRepository)
    │       └── PostgresBackupExecutor.java     (interface — driven port for pg_dump/psql)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   └── services/
    │       ├── BackupService.java              (interface)
    │       └── BackupServiceImpl.java          (publishes BackupCreated, BackupRestored events)
    │                                           NOTE: Restore uses SAGA pattern (see FR-11)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   ├── persistence/
    │   │   ├── BackupRecordRepositoryImpl.java (NEW — implements clean port)
    │   │   └── SpringBackupRecordRepository.java (NEW — Spring Data JPA)
    │   ├── adapters/
    │   │   └── PostgresBackupExecutorImpl.java (implements PostgresBackupExecutor port)
    │   └── config/
    │       ├── BackupProperties.java
    │       └── BackupDirectoryInitializer.java
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── BackupController.java
        └── dto/
            └── response/
                └── BackupRecordDTO.java
```

**EDA role:** Producer — publishes `BackupCreatedEvent`/`BackupRestoredEvent` for audit logging.

##### FR-5.9 — Realtime Module (4-Layer Clean Architecture + EDA Consumer)

```
com.intelliquiz.api.realtime/
├── package-info.java                          ← @ApplicationModule(allowedDependencies={"shared","quiz","team","submission"})
├── RealtimeFacade.java                        ← PUBLIC API (if other modules need to trigger broadcasts)
│
└── internal/
    ├── domain/                                ← LAYER 1: DOMAIN
    │   ├── enums/
    │   │   ├── GameState.java                 (value object — enum representing game FSM states)
    │   │   └── HostCommandType.java
    │   └── (no entities — realtime is stateless/in-memory)
    │
    ├── application/                           ← LAYER 2: APPLICATION
    │   ├── services/
    │   │   ├── GameFlowService.java            (orchestrator — depends on module facades, NOT repositories)
    │   │   │                                   NOTE: Quiz activation uses SAGA pattern (see FR-11)
    │   │   ├── QuizTimerService.java
    │   │   ├── AnswerDistributionService.java
    │   │   ├── QuizBroadcastService.java
    │   │   └── QuizSessionManager.java
    │   └── listeners/
    │       └── RealtimeEventListener.java      (handles SessionActivated, TeamRegistered, AnswerSubmitted, etc.)
    │
    ├── infrastructure/                        ← LAYER 3: INFRASTRUCTURE
    │   └── config/
    │       ├── WebSocketConfig.java
    │       ├── WebSocketAuthInterceptor.java
    │       └── WebSocketEventListener.java
    │
    └── presentation/                          ← LAYER 4: PRESENTATION
        ├── controllers/
        │   └── QuizWebSocketController.java
        ├── exception/
        │   └── WebSocketExceptionHandler.java
        └── dto/
            ├── AnswerDistribution.java
            ├── AnswerRevealPayload.java
            ├── BufferMessage.java
            ├── ErrorMessage.java
            ├── GameStateMessage.java
            ├── HostCommand.java
            ├── HostNotification.java
            ├── QuestionPayload.java
            ├── SubmissionMessage.java
            ├── TeamInfo.java
            ├── TeamResult.java
            └── TimerMessage.java
```

**EDA role:** Consumer — the `RealtimeEventListener` in the application layer reacts to events from `quiz`, `team`, and `submission` modules to trigger WebSocket broadcasts. This replaces the current direct repository access in `GameFlowService`.

#### FR-6: Clean Architecture + EDA Integration Rules

##### FR-6.1: Event Publishing Location

- Application events **SHALL** only be published from the **Application Layer** (use case services), never from Domain, Infrastructure, or Presentation layers.
- The `ApplicationEventPublisher` **SHALL** be injected into application services, not into domain entities or infrastructure adapters.

##### FR-6.2: Event Consumption Location

- Event listeners **SHALL** reside in the **Application Layer** of the consuming module (under `internal/application/listeners/`).
- Listeners **SHALL** be annotated with `@ApplicationModuleListener` (Spring Modulith's event listener).
- Listeners **SHALL** delegate to application services for business logic — they are thin routing handlers, not business logic containers.

##### FR-6.3: Facade Pattern for Cross-Module Reads

- Each module (except `shared`) **SHALL** expose a `<Module>Facade` class in the module root package.
- The facade **SHALL** be annotated `@Service` and serve as the **only** public entry point for other modules to query data synchronously.
- Facades **SHALL** return only public DTOs (from the module's `dto/` package), never internal entities.
- Facades **SHALL** delegate to internal application services — they are thin wrappers, not business logic containers.

Example:
```java
// com.intelliquiz.api.quiz.QuizFacade (PUBLIC)
@Service
public class QuizFacade {
    private final QuizManagementService quizService;  // internal

    public QuizInfoDto getQuizInfo(Long quizId) { ... }
    public QuestionInfoDto getQuestionForGrading(Long questionId) { ... }
    public boolean quizExists(Long quizId) { ... }
}
```

##### FR-6.4: Domain Layer Purity

- Domain entities **SHALL NOT** import any Spring framework classes (exception: JPA annotations, see [CC-6](#cc-6-jpa-annotations-on-domain-entities)).
- Domain services **SHALL** be pure Java classes with no Spring annotations; they are registered as beans via `@Bean` methods in Infrastructure layer config classes, or via `@Service` if pragmatism is preferred.
- Repository port interfaces (in the Domain layer) **SHALL** be plain Java interfaces with no Spring annotations.

##### FR-6.5: Layer Communication Flow

**For a typical REST API request within one module:**

```
HTTP Request
    ↓
[Presentation] Controller validates request, maps to command
    ↓
[Application] Service executes use case, calls domain + port interfaces
    ↓
[Domain] Entity enforces business rules, returns result
    ↓
[Infrastructure] Repository adapter persists changes via Spring Data JPA
    ↓
[Application] Service publishes event via ApplicationEventPublisher (if cross-module side effects needed)
    ↓
[Presentation] Controller maps result to response DTO
    ↓
HTTP Response
```

**For a cross-module event-driven flow (EDA):**

```
[Module A — Application] Service publishes event
    ↓
[Spring Modulith Event Bus]
    ↓
[Module B — Application] Listener receives event
    ↓
[Module B — Application] Service processes event, calls domain + ports
    ↓
[Module B — Infrastructure] Adapter persists result
```

#### FR-7: Global Exception Handling

- `GlobalExceptionHandler` **SHALL** remain in the `shared` module (or a top-level shared location) since it handles exceptions from all modules.
- It **SHALL** continue to map all domain exceptions to their current HTTP status codes.

#### FR-8: Entity Ownership and Cross-Module Access

- Each JPA entity **SHALL** be owned by exactly one module.
- Modules that need to reference entities from other modules **SHALL** use:
  - **ID references** (e.g., `Long quizId`) rather than navigable entity references across module boundaries
  - **Read-only DTOs** exposed by the owning module's public API
  - **Application events** for write operations that span modules

| Entity | Owning Module | DDD Role |
|---|---|---|
| `User` | `user` | Aggregate Root |
| `QuizAssignment` | `user` | Child Entity (within User aggregate) |
| `Quiz` | `quiz` | Aggregate Root |
| `Question` | `quiz` | Child Entity (within Quiz aggregate) |
| `Team` | `team` | Aggregate Root |
| `Submission` | `submission` | Aggregate Root |
| `BackupRecord` | `backup` | Aggregate Root |
| `ScoreboardEntry` | `scoreboard` | Read Model Entity (CQRS) |

#### FR-9: DDD Tactical Patterns per Module

Each module's **domain layer** SHALL apply the following DDD tactical patterns where appropriate:

##### FR-9.1: Aggregate Roots and Boundaries

An **Aggregate Root** is the single entry point for modifying a cluster of related entities. In IntelliQuiz:

| Aggregate Root | Aggregate Boundary (child entities) | Invariants Enforced |
|---|---|---|
| `Quiz` | `Question` (1:N) | State machine (DRAFT→READY requires ≥1 question; only READY can activate) |
| `User` | `QuizAssignment` (1:N) | Username uniqueness; password strength; role consistency |
| `Team` | *(none)* | Access code uniqueness per quiz; team name uniqueness per quiz |
| `Submission` | *(none)* | One submission per team per question; auto-grading correctness |
| `BackupRecord` | *(none)* | Status transitions (PENDING→COMPLETED/FAILED) |

**Rules:**
- Repository port interfaces **SHALL** exist only for Aggregate Roots (one `<Aggregate>Repository` per module that has entities).
- `QuestionRepository` is a **pragmatic exception** — direct question queries are needed for grading, but `Question` is still part of the `Quiz` aggregate for write operations.
- Child entities **SHALL** only be mutated through their Aggregate Root (e.g., `quiz.addQuestion()`, `quiz.removeQuestion()`).

##### FR-9.2: Value Objects

The following domain concepts **SHALL** be modeled as immutable **Value Objects** (Java `record` types with validation in the constructor):

| Value Object | Module | Encapsulates | Example |
|---|---|---|---|
| `AccessCode` | `team` | 6-char alphanumeric code with format validation | `new AccessCode("ABC123")` — throws if invalid format |
| `ProctorPin` | `quiz` | 4-digit numeric PIN | `new ProctorPin("1234")` — throws if non-numeric or wrong length |
| `QuizSession` | `quiz` | Live session state (isLive, accessCode, proctorPin) | Immutable snapshot of session config |
| `Score` | `submission` | Integer score with range (0 to max points) | `new Score(10, 10)` — validates score ≤ maxPoints |
| `GameState` | `realtime` | Enum-based FSM state (LOBBY, BUFFER, ACTIVE, GRADING, REVEAL) | Already exists as enum — fine as-is |

> **Pragmatic note:** Not every primitive needs a value object. Use them when the type has **validation logic** or **business meaning** beyond a raw `String`/`int`. Keep it simple.

##### FR-9.3: Domain Services

Domain services **SHALL** be used for business logic that doesn't naturally belong to a single entity:

| Domain Service | Module | Responsibility |
|---|---|---|
| `CodeGenerationService` | `shared` | Generate access codes and proctor PINs (stateless utility) |
| `GradingService` | `submission` | Compare submitted answer to correct answer (stateless, pure logic) |

> **Pragmatic note:** Most business logic lives in Aggregate Root methods (e.g., `Quiz.activate()`, `Submission.grade()`). Domain services are only needed when logic spans multiple entities or is purely computational.

##### FR-9.4: Ubiquitous Language

The codebase **SHALL** use **consistent naming** that matches the business domain:

| Business Concept | Code Term | NOT |
|---|---|---|
| Quiz game session going live | `Quiz.activate()` / `QuizSessionActivatedEvent` | `Quiz.start()` / `SessionStartEvent` |
| Team joining a quiz | `TeamRegisteredEvent` | `TeamCreatedEvent` (teams pre-exist) |
| Grading a submission | `Submission.grade()` / `SubmissionGradedEvent` | `Submission.score()` |
| Assigning quiz permissions | `PermissionsAssignedEvent` | `RoleGrantedEvent` |

#### FR-10: CQRS for Scoreboard Module

CQRS (Command Query Responsibility Segregation) **SHALL** be applied **only** to the scoreboard module. No other module requires CQRS.

##### FR-10.1: Why CQRS for Scoreboard Only

| Factor | Scoreboard | Other Modules |
|---|---|---|
| Read/Write ratio | **Read-heavy** (many teams viewing, few score updates) | Balanced |
| Query complexity | Complex (join Team + Submission + rank calculation) | Simple (single-aggregate queries) |
| Consistency requirement | **Eventual** (< 1 sec lag acceptable for leaderboard) | **Strong** (submissions must be immediately consistent) |
| Benefit of denormalization | **High** (pre-computed ranks, no joins) | Low (queries are simple enough) |

##### FR-10.2: CQRS Implementation

```
WRITE SIDE (handled by submission module):
  SubmissionService.grade() → publishes SubmissionGradedEvent

           ↓ (async event)

READ SIDE (handled by scoreboard module):
  ScoreboardProjection.on(SubmissionGradedEvent)
    → updates ScoreboardEntry (denormalized table: teamId, teamName, quizId, totalScore, rank)
    → recalculates rankings for the quiz

QUERY:
  ScoreboardQueryService.getLeaderboard(quizId)
    → SELECT * FROM scoreboard_entries WHERE quiz_id = ? ORDER BY rank ASC
    → No joins, pre-calculated, fast
```

**Read model entity:**
```java
@Entity
@Table(name = "scoreboard_entries")
public class ScoreboardEntry {
    @Id private Long id;
    private Long teamId;
    private Long quizId;
    private String teamName;
    private int totalScore;
    private int rank;
    private Instant lastUpdated;
}
```

**Projection (event handler):**
```java
@ApplicationModuleListener
public class ScoreboardProjection {

    public void on(SubmissionGradedEvent event) {
        ScoreboardEntry entry = readRepo.findByTeamIdAndQuizId(
            event.teamId(), event.quizId());
        if (entry == null) {
            entry = new ScoreboardEntry(event.teamId(), event.quizId());
        }
        entry.addScore(event.score());
        readRepo.save(entry);
        recalculateRanks(event.quizId());
    }

    public void on(TeamScoreResetEvent event) {
        readRepo.resetScoresForQuiz(event.quizId());
    }
}
```

##### FR-10.3: CQRS Constraints

- The scoreboard read model **SHALL** be stored in its **own database table** (`scoreboard_entries`), separate from the `submissions` table.
- The `ScoreboardProjection` **SHALL** be idempotent — processing the same event twice produces the same result.
- The read model **SHALL** include a `lastUpdated` timestamp for cache invalidation.
- Query response time target: **< 50ms** for leaderboard retrieval.

#### FR-11: Saga Pattern for Complex Workflows

The Saga pattern **SHALL** be applied to **only two workflows** in IntelliQuiz where multi-step coordination with compensating transactions is needed:

##### FR-11.1: Quiz Activation Saga (Realtime Module)

**Purpose:** Quiz activation involves multiple coordinated steps across modules. If any step fails, prior steps must be rolled back.

```
Quiz Activation Saga Steps:
┌─────────────────────────────────────────────────────────┐
│ Step 1: Deactivate any other live quiz for this host    │
│         (call quiz module facade)                        │
│         ↓ success                                        │
│ Step 2: Activate the target quiz                        │
│         (call quiz module facade → publishes event)      │
│         ↓ success                                        │
│ Step 3: Initialize WebSocket session                    │
│         (create session in QuizSessionManager)           │
│         ↓ success                                        │
│ Step 4: Notify connected clients via broadcast          │
│         (QuizBroadcastService)                           │
│         ↓ success                                        │
│ ✅ COMPLETE                                              │
│                                                          │
│ On failure at any step → COMPENSATE:                    │
│   - Deactivate quiz (if step 2 succeeded)               │
│   - Cleanup session (if step 3 succeeded)               │
│   - Notify clients of cancellation                      │
└─────────────────────────────────────────────────────────┘
```

**Implementation approach:** Simple orchestration saga (not choreography). The `GameFlowService` acts as the saga orchestrator with a try/catch block and explicit compensation methods. No saga state persistence needed — this runs within a single request lifecycle.

##### FR-11.2: Backup Restoration Saga (Backup Module)

**Purpose:** Database restore is destructive — if restore fails midway, the system must recover.

```
Backup Restoration Saga Steps:
┌─────────────────────────────────────────────────────────┐
│ Step 1: Validate backup file exists                     │
│         ↓ success                                        │
│ Step 2: Create a safety backup (automatic pre-restore)  │
│         ↓ success                                        │
│ Step 3: Execute pg_dump restore via PostgresBackupExecutor│
│         ↓ success                                        │
│ Step 4: Update BackupRecord status to RESTORED          │
│         Publish BackupRestoredEvent                      │
│         ↓ success                                        │
│ ✅ COMPLETE                                              │
│                                                          │
│ On failure at step 3 → COMPENSATE:                      │
│   - Restore from safety backup (step 2 output)          │
│   - Update BackupRecord status to FAILED                │
│   - Log error for admin review                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation approach:** Simple orchestration within `BackupServiceImpl`. The safety backup created in step 2 serves as the compensation mechanism.

##### FR-11.3: Saga Design Constraints

- Sagas **SHALL** be implemented as simple **orchestration patterns** (sequential steps with explicit compensation), NOT as event choreography or state machines.
- Saga orchestrators **SHALL** live in the **Application Layer** of their respective modules.
- No external saga framework is required — plain Java try/catch with compensating method calls is sufficient for these two use cases.
- Saga complexity **SHALL NOT** be added to any other workflow unless explicitly justified.

> **Pragmatic note:** These are the simplest form of sagas — essentially "try-compensate" blocks. This is appropriate for a modular monolith. Full saga frameworks (Axon, temporal.io) are overkill here.

---

### 1.4 Non-Functional Requirements

#### NFR-1: Zero Downtime Migration

- The migration **SHALL** be performed incrementally, module by module.
- The application **SHALL** remain fully functional and deployable after each migration phase.
- Each phase **SHALL** be independently committable and reversible.

#### NFR-2: Build & Test Continuity

- All existing 40+ test classes **SHALL** continue to pass throughout the migration.
- The Maven build (`mvn clean verify`) **SHALL** succeed at every intermediate step.
- No test **SHALL** be deleted; tests may only be moved or updated to match new package paths.

#### NFR-3: Performance

- Module boundary enforcement and event-driven communication **SHALL NOT** introduce measurable latency to synchronous REST API responses (< 5ms overhead per request).
- WebSocket real-time game flow **SHALL** maintain sub-100ms server-side processing for all game state transitions.
- Application startup time **SHALL NOT** increase by more than 10%.

#### NFR-4: Observability

- Spring Modulith's built-in observability features **SHALL** be enabled:
  - Module interaction logging (which modules call which)
  - Application event tracing
- Module component documentation **SHALL** be auto-generated using `Documenter` in tests.

#### NFR-5: Developer Experience

- The module structure **SHALL** be consistent and predictable — every module follows the same 4-layer Clean Architecture template with EDA integration points.
- A developer opening any module **SHALL** immediately know where to find: domain entities (`internal/domain/entities/`), use case services (`internal/application/services/`), repository adapters (`internal/infrastructure/persistence/`), REST controllers (`internal/presentation/controllers/`), and event listeners (`internal/application/listeners/`).
- Adding a new feature **SHALL** require touching at most 1-2 modules.
- Adding a new event flow **SHALL** require only: (1) creating an event record in the producer module's `events/` package, (2) publishing it from the Application layer, (3) creating a listener in the consumer module's `internal/application/listeners/` package.
- IDE navigation and refactoring support **SHALL** be preserved (no reflection-based hacks).

#### NFR-6: Docker Compatibility

- The `Dockerfile` and `docker-compose.yml` configurations **SHALL** continue to work without modification.
- No changes to the container image build process **SHALL** be required.

---

### 1.5 Module Inventory Requirements

Each module **SHALL** follow this standardized structure combining **Spring Modulith module boundaries** with **Clean Architecture's 4-layer internal organization** and **EDA integration points**:

```
com.intelliquiz.api.<module>/
│
│  ┌──────────────────────────────────────────────────────┐
│  │         PUBLIC API (accessible by other modules)      │
│  └──────────────────────────────────────────────────────┘
├── package-info.java                    ← @ApplicationModule annotation
├── <Module>Facade.java                  ← Public API entry point (synchronous reads)
├── events/                              ← Published event records (EDA contracts)
│   └── <Event>.java                     ← Immutable records with IDs + Instant
├── dto/                                 ← Public DTOs for cross-module data transfer
│   └── <Dto>.java                       ← Read-only records, no entity references
│
│  ┌──────────────────────────────────────────────────────┐
│  │         INTERNAL (hidden from other modules)          │
│  └──────────────────────────────────────────────────────┘
└── internal/
    │
    │  ╔══════════════════════════════════════════════════╗
    │  ║  LAYER 1 — DOMAIN (innermost, zero dependencies) ║
    │  ║  DDD Tactical Patterns live here                  ║
    │  ╚══════════════════════════════════════════════════╝
    ├── domain/
    │   ├── entities/                     ← Aggregate Roots + child entities
    │   │   └── <Entity>.java             ← Aggregate Root enforces invariants
    │   ├── valueobjects/                 ← DDD Value Objects (immutable, no identity)
    │   │   └── <ValueObject>.java        ← e.g., AccessCode, Score, ProctorPin
    │   ├── ports/                        ← Repository interfaces (one per Aggregate Root)
    │   │   └── <Repository>.java         ← Plain Java interface, no Spring annotations
    │   └── services/                     ← Domain services (stateless cross-entity logic)
    │       └── <DomainService>.java      ← Pure Java, no framework dependencies
    │
    │  ╔══════════════════════════════════════════════════╗
    │  ║  LAYER 2 — APPLICATION (use cases + EDA)         ║
    │  ╚══════════════════════════════════════════════════╝
    ├── application/
    │   ├── services/                     ← Use case orchestrators
    │   │   └── <Service>.java            ← @Service, @Transactional
    │   ├── commands/                     ← Input command records
    │   │   └── <Command>.java
    │   └── listeners/                    ← EDA event consumers
    │       └── <EventListener>.java      ← @ApplicationModuleListener
    │
    │  ╔══════════════════════════════════════════════════╗
    │  ║  LAYER 3 — INFRASTRUCTURE (adapters + config)    ║
    │  ╚══════════════════════════════════════════════════╝
    ├── infrastructure/
    │   ├── persistence/                  ← Repository port implementations
    │   │   ├── <RepositoryImpl>.java     ← @Component, implements domain port
    │   │   └── <SpringRepository>.java   ← @Repository, extends JpaRepository
    │   ├── adapters/                     ← External service adapters
    │   │   └── <Adapter>.java
    │   └── config/                       ← Spring configuration beans
    │       └── <Config>.java             ← @Configuration, @ConfigurationProperties
    │
    │  ╔══════════════════════════════════════════════════╗
    │  ║  LAYER 4 — PRESENTATION (REST/WebSocket API)     ║
    │  ╚══════════════════════════════════════════════════╝
    └── presentation/
        ├── controllers/                  ← HTTP/WS endpoints
        │   └── <Controller>.java         ← @RestController / @Controller
        └── dto/
            ├── request/                  ← Inbound validation DTOs
            │   └── <Request>.java        ← @NotBlank, @Size, etc.
            └── response/                 ← Outbound response DTOs
                └── <Response>.java       ← @Schema, from() factory
```

**Key structural principles:**

| Principle | Enforcement |
|---|---|
| **Dependency Rule** | Code in inner layers never imports from outer layers. Domain has zero imports from Application/Infrastructure/Presentation. |
| **DDD Aggregates** | Each module's domain layer defines **Aggregate Roots** as consistency boundaries. Repository ports exist only for Aggregate Roots (not child entities). Child entities are accessed through their Aggregate Root. |
| **DDD Value Objects** | Immutable, identity-less types (e.g., `AccessCode`, `Score`) **SHALL** be modeled as Java `record` types in the `valueobjects/` package. They encapsulate validation logic. |
| **Ports & Adapters** | Domain layer defines **port interfaces**; Infrastructure layer provides **adapter implementations**. Application layer programs against ports, not concrete classes. |
| **EDA integration** | Events are published in the Application layer (services). Events are consumed in the Application layer (listeners). Events are defined in the module's public `events/` package. |
| **Module privacy** | Everything under `internal/` is invisible to other modules. Only `<Module>Facade.java`, `events/`, and `dto/` are accessible. |
| **Consistent naming** | Every module follows this exact template. A developer navigating any module knows exactly where to find controllers, services, entities, and event handlers. |

---

### 1.6 Cross-Cutting Concerns

#### CC-1: Shared Module as Foundation

- The `shared` module **SHALL** be a dependency-free foundation.
- It **SHALL** contain only types that are referenced by 3+ modules.
- Module-specific exceptions MAY remain in their owning module if referenced by ≤ 2 modules.

#### CC-2: Authentication & Security Filter Chain

- `JwtAuthenticationFilter`, `SecurityConfig`, and `CorsConfig` **SHALL** remain in the `auth` module.
- Since Spring Security's filter chain is application-global, the `auth` module is implicitly loaded before all request processing.
- Other modules **SHALL NOT** define their own security filters.

#### CC-3: JPA Entity Relationships Across Modules

Cross-module JPA relationships present the biggest Spring Modulith challenge. The following strategies **SHALL** be applied:

| Relationship | Current State | Required Change |
|---|---|---|
| `Quiz ↔ Question` (`@OneToMany`) | Same aggregate — both in `quiz` module | No change needed (same module) |
| `Quiz ↔ Team` (`@OneToMany`) | Cross-module (`quiz` ↔ `team`) | Team stores `quizId` (Long); Quiz module exposes read-only quiz info via facade |
| `Quiz ↔ Submission` (via Team) | Cross-module (`quiz` ↔ `submission`) | Submission stores `questionId` + `teamId` (Longs); no navigable Quiz reference |
| `User ↔ QuizAssignment` (`@OneToMany`) | Cross-module (`user` ↔ `quiz`) | QuizAssignment owned by `user` module; references `quizId` (Long) rather than `Quiz` entity |
| `Team ↔ Submission` (`@OneToMany`) | Cross-module (`team` ↔ `submission`) | Submission stores `teamId` (Long); Team exposes team info via facade |
| `Quiz ↔ User` (via `createdBy`) | Cross-module (`quiz` ↔ `user`) | Quiz stores `createdByUserId` (Long) instead of `User` entity reference |

#### CC-4: Global Exception Handler Placement

- `GlobalExceptionHandler` **SHALL** be placed in the `shared` module.
- It is annotated `@RestControllerAdvice` which is application-global, so it must be accessible to all modules.

#### CC-5: Environment Initialization

- `EnvInitializer` **SHALL** remain in the root package (`com.intelliquiz.api`) alongside `IntelliQuizApiApplication`.
- The root package is the `@SpringBootApplication` scan base and is not part of any module.

#### CC-6: JPA Annotations on Domain Entities

- JPA annotations (`@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@ManyToOne`, `@OneToMany`, `@Column`, `@Enumerated`) on domain entities are a **pragmatic exception** to the Clean Architecture purity rule.
- In a single-deployment Spring Modulith application, forcing a separate persistence model (mapped from pure domain entities) would introduce significant mapping boilerplate with minimal benefit.
- Domain entities **MAY** retain JPA annotations, but **SHALL NOT** import Spring framework classes (`@Component`, `@Service`, `@Autowired`, etc.).
- If a future decision is made to extract a module into a separate microservice, the domain entities can be purified at that point.

#### CC-7: Clean Architecture Compliance per Module

- Each module **SHALL** maintain strict layer separation as defined in [FR-2.1](#fr-21-clean-architecture-layer-rules-within-each-module).
- No class in the Domain layer **SHALL** import from `application/`, `infrastructure/`, or `presentation/` packages.
- No class in the Application layer **SHALL** import from `infrastructure/` or `presentation/` packages.
- No class in the Infrastructure layer **SHALL** import from `presentation/` packages.
- This is enforced by package structure review and can be further validated with ArchUnit tests.

---

### 1.7 Dependency & Coupling Requirements

#### DC-1: Decoupling `GameFlowService` (Critical Priority)

`GameFlowService` currently has 8 constructor dependencies spanning 4 domain aggregates. It **SHALL** be refactored to:

1. Replace direct `QuizRepository`/`QuestionRepository` access with calls to the `quiz` module's facade
2. Replace direct `TeamRepository` access with calls to the `team` module's facade
3. Replace direct `SubmissionRepository` access with calls to the `submission` module's facade
4. Keep `QuizTimerService`, `QuizBroadcastService`, `QuizSessionManager`, `AnswerDistributionService` as internal collaborators of the `realtime` module

Target constructor signature:
```java
GameFlowService(
    QuizTimerService timerService,              // internal
    QuizBroadcastService broadcastService,      // internal
    QuizSessionManager sessionManager,          // internal
    AnswerDistributionService distributionService, // internal
    QuizFacade quizFacade,                      // quiz module API
    TeamFacade teamFacade,                      // team module API
    SubmissionFacade submissionFacade            // submission module API
)
```

#### DC-2: Decoupling `UserManagementService` (High Priority)

`UserManagementService` bridges User ↔ Quiz via `QuizAssignment`. It **SHALL**:

1. Own the `QuizAssignment` entity within the `user` module
2. Reference quizzes by `quizId` (Long) only
3. Call the `quiz` module's facade to validate quiz existence before assigning permissions
4. Publish `PermissionsAssignedEvent` / `PermissionsRevokedEvent` instead of directly modifying Quiz aggregate

#### DC-3: Decoupling `SubmissionService` (High Priority)

`SubmissionService` has 3-way coupling (Team ↔ Question ↔ Submission). It **SHALL**:

1. Own the `Submission` entity
2. Reference teams by `teamId` and questions by `questionId` (Longs)
3. Call `team` module facade to validate team existence
4. Call `quiz` module facade to validate question existence and get correct answer for grading
5. Publish `AnswerSubmittedEvent` after submission

#### DC-4: Decoupling `AuthorizationService` (Medium Priority)

`AuthorizationService` navigates `User.getAssignments()` to check quiz permissions. It **SHALL**:

1. Accept user permissions as parameters (from an auth context or token claims) rather than navigating entity relationships
2. OR call the `user` module facade to query permissions for a given `userId` + `quizId`

#### DC-5: Decoupling `ScoreboardService` (Medium Priority)

`ScoreboardService` reads Quiz + Team aggregates. It **SHALL**:

1. Call `quiz` module facade for quiz metadata
2. Call `team` module facade for team scores
3. OR listen to `SubmissionGradedEvent` to maintain its own materialized scoreboard view

---

### 1.8 Event-Driven Communication Requirements

#### EV-1: Required Application Events

The following Spring application events **SHALL** be introduced to replace direct cross-module service calls:

| Event | Published By | Consumed By | Trigger |
|---|---|---|---|
| `QuizCreatedEvent(quizId, title, createdByUserId)` | `quiz` | `realtime` (optional pre-registration) | Quiz created |
| `QuizStatusChangedEvent(quizId, oldStatus, newStatus)` | `quiz` | `realtime`, `team` | Quiz state transition |
| `QuizSessionActivatedEvent(quizId)` | `quiz` | `realtime` | Live session started |
| `QuizSessionDeactivatedEvent(quizId)` | `quiz` | `realtime` | Live session ended |
| `QuestionAddedEvent(questionId, quizId)` | `quiz` | *(none currently)* | Question added to quiz |
| `QuestionDeletedEvent(questionId, quizId)` | `quiz` | `submission` (cleanup) | Question deleted |
| `TeamRegisteredEvent(teamId, quizId, teamName)` | `team` | `realtime` | Team joins quiz |
| `TeamRemovedEvent(teamId, quizId)` | `team` | `realtime`, `submission` | Team removed |
| `AnswerSubmittedEvent(submissionId, teamId, questionId)` | `submission` | `realtime`, `scoreboard` | Answer submitted |
| `SubmissionGradedEvent(submissionId, teamId, questionId, score)` | `submission` | `realtime`, `scoreboard` | Submission auto-graded |
| `UserCreatedEvent(userId, username, role)` | `user` | *(audit/logging)* | Admin account created |
| `PermissionsAssignedEvent(userId, quizId, permissions)` | `user` | `auth` (cache refresh) | Quiz permissions granted |
| `PermissionsRevokedEvent(userId, quizId)` | `user` | `auth` (cache refresh) | Quiz permissions revoked |
| `BackupCreatedEvent(backupId, filename)` | `backup` | *(audit/logging)* | Backup completed |
| `BackupRestoredEvent(backupId, filename)` | `backup` | *(audit/logging)* | Restore completed |

#### EV-2: Event Design Rules

- All events **SHALL** be Java `record` types (immutable).
- Events **SHALL** carry only IDs and primitive/enum values — never entity references.
- Events **SHALL** be placed in the publishing module's `events/` public package.
- Events **SHOULD** include a `java.time.Instant occurredAt` field.

#### EV-3: Synchronous vs. Asynchronous Events

| Communication Pattern | When to Use |
|---|---|
| **Synchronous** (`@TransactionalEventListener(phase = BEFORE_COMMIT)`) | When the consumer must succeed for the publisher's transaction to commit (e.g., `QuestionDeletedEvent` → cleanup submissions) |
| **Asynchronous** (`@ApplicationModuleListener` or `@Async @EventListener`) | When the consumer can fail independently (e.g., `AnswerSubmittedEvent` → update realtime broadcast) |

---

### 1.9 Testing Requirements

#### TR-1: Module Verification Test

A test **SHALL** be created that verifies the entire module structure:

```java
@Test
void shouldVerifyModularStructure() {
    ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
    modules.verify(); // Fails on: cyclic deps, illegal cross-module access, unnamed modules
}
```

This test **SHALL** pass before any individual module tests are written.

#### TR-2: Per-Module Integration Tests

Each module **SHALL** have at least one `@ApplicationModuleTest` that:

1. Bootstraps only the target module and its declared dependencies
2. Verifies the module's core use case in isolation
3. Uses the `Scenario` API for event verification where applicable

| Module | Minimum Test Coverage |
|---|---|
| `auth` | Successful login, failed login, JWT token validation |
| `user` | Create admin, update admin, assign/revoke permissions |
| `quiz` | Create quiz, add question, state transitions (DRAFT → READY → ARCHIVED) |
| `team` | Register team, remove team |
| `submission` | Submit answer, auto-grade, duplicate submission rejection |
| `scoreboard` | Compute leaderboard for a quiz with submissions |
| `backup` | Create backup record, list backups |
| `realtime` | Host command processing, game state transitions |

#### TR-3: Event Publication Tests

For every event defined in [EV-1](#ev-1-required-application-events), a test **SHALL** verify:

1. The event is published when the expected action occurs
2. The event carries the correct payload
3. Registered listeners receive and process the event

#### TR-4: Existing Test Migration

- All 40+ existing test classes **SHALL** be moved to match new package paths.
- Test functionality **SHALL NOT** change — only `import` statements and package declarations are updated.
- Property-based tests (jqwik) **SHALL** continue to work within the module test context.

#### TR-5: Module Documentation Generation

A test **SHALL** generate module documentation:

```java
@Test
void generateModuleDocumentation() {
    ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
    new Documenter(modules)
        .writeModulesAsPlantUml()
        .writeIndividualModulesAsPlantUml();
}
```

---

### 1.10 Migration Constraints

#### MC-1: Phased Execution Order

The migration **SHALL** follow this strict phase order (each phase produces a deployable build):

| Phase | Description | Why This Order |
|---|---|---|
| **Phase 0** | Preparation — clean up anti-patterns (AP-1 through AP-5) | Fix leaky abstractions before moving code |
| **Phase 1** | Extract `shared` module | Foundation required by all other modules |
| **Phase 2** | Extract `auth` module | Security infrastructure needed before business modules |
| **Phase 3** | Extract `quiz` module | Core business entity referenced by team, submission, scoreboard, realtime |
| **Phase 4** | Extract `user` module | Depends on auth + quiz (for permission assignments) |
| **Phase 5** | Extract `team` module | Depends on quiz |
| **Phase 6** | Extract `submission` module | Depends on quiz + team |
| **Phase 7** | Extract `scoreboard` module | Depends on team + submission |
| **Phase 8** | Extract `backup` module | Independent; depends only on shared + auth |
| **Phase 9** | Extract `realtime` module | Highest coupling; done last when all facades exist |
| **Phase 10** | Validation — full module verification, event tests, documentation generation | Final sign-off |

#### MC-2: No New Features During Migration

- No new business features **SHALL** be added during the migration window.
- Bug fixes to existing functionality ARE permitted and should target the current module's location at time of fix.

#### MC-3: Version Control Strategy

- Each phase **SHALL** be completed in a dedicated feature branch (e.g., `modulith/phase-1-shared`).
- Each branch **SHALL** pass `mvn clean verify` before merging to `main`.
- Commit messages **SHALL** follow the pattern: `modulith(phase-N): <description>`.

#### MC-4: Dependency Version Alignment

- Spring Modulith BOM version **SHALL** remain at `1.2.3` (compatible with Spring Boot 3.2.5).
- No Spring Boot version upgrade is required or permitted during the migration.
- Java 21 **SHALL** remain the target language level.

---

### 1.11 Acceptance Criteria

The Spring Modulith migration is considered **complete** when ALL of the following criteria are met:

| # | Criterion | Verification Method |
|---|---|---|
| AC-1 | `ApplicationModules.of(IntelliQuizApiApplication.class).verify()` passes with zero violations | Module verification test |
| AC-2 | All 9 modules are detected and named correctly by Spring Modulith | `modules.stream().count() == 9` in test |
| AC-3 | No cyclic dependencies exist between modules | Verification test (built-in check) |
| AC-4 | No module accesses another module's `internal` package | Verification test (built-in check) |
| AC-5 | Every module has a `package-info.java` with `@ApplicationModule` | Code review + verification test |
| AC-6 | All existing REST API integration tests pass | `mvn test` |
| AC-7 | All 40+ existing property-based tests pass | `mvn test` |
| AC-8 | Each module has at least one `@ApplicationModuleTest` | Test inventory review |
| AC-9 | All events from [EV-1](#ev-1-required-application-events) are defined and tested | Event publication tests |
| AC-10 | Module documentation (PlantUML diagrams) is auto-generated | Documentation generation test |
| AC-11 | Docker build (`docker-compose up`) succeeds and application is accessible | Manual/CI verification |
| AC-12 | Frontend application works without any changes | Manual verification |
| AC-13 | No class in `internal` package is imported by code outside its module | Verification test |
| AC-14 | `GameFlowService` constructor has ≤ 4 external module facade dependencies | Code review |
| AC-15 | `BackupRecordRepository` follows the clean port/adapter pattern | Code review |
| AC-16 | Every module (except `shared`) contains exactly 4 internal layers: `domain/`, `application/`, `infrastructure/`, `presentation/` | Directory structure review |
| AC-17 | No domain layer class imports from `application/`, `infrastructure/`, or `presentation/` packages | ArchUnit test or manual review |
| AC-18 | No application layer class imports from `infrastructure/` or `presentation/` packages | ArchUnit test or manual review |
| AC-19 | All application events are published only from Application layer services, never from Domain or Infrastructure | Code review |
| AC-20 | All event listeners reside in `internal/application/listeners/` packages | Directory structure review |
| AC-21 | Every module that produces events has an `events/` public sub-package with immutable record types | Code review |
| AC-22 | Every module facade returns only public DTOs, never internal domain entities | Code review |
| AC-23 | Repository port interfaces in Domain layer have zero Spring annotations | Code review |
| AC-24 | Each module with entities has a clearly identified Aggregate Root class annotated with `@Entity` | Code review |
| AC-25 | Repository port interfaces exist **only** for Aggregate Roots (exception: `QuestionRepository` for query purposes) | Code review |
| AC-26 | Value Objects (`AccessCode`, `ProctorPin`, `Score`) are implemented as immutable Java `record` types with constructor validation | Code review + unit tests |
| AC-27 | Scoreboard module uses CQRS read model: `ScoreboardEntry` entity + `ScoreboardProjection` event listener | Integration test |
| AC-28 | `ScoreboardProjection.on(SubmissionGradedEvent)` is idempotent (processing same event twice = same result) | Unit test |
| AC-29 | Scoreboard leaderboard query (`getLeaderboard(quizId)`) returns results in **< 50ms** for 100+ teams | Performance test |
| AC-30 | Quiz activation in `GameFlowService` implements Saga with compensating transactions on failure | Code review + integration test |
| AC-31 | Backup restore in `BackupServiceImpl` creates safety backup before restore and compensates on failure | Integration test |
| AC-32 | Consistent ubiquitous language is used across module names, event names, and method names per FR-9.4 | Code review |