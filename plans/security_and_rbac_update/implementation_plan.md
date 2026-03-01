# IntelliQuiz — Security, RBAC & Question Bank Implementation Plan

> **Scope:** Backend only (`backend/` directory). No frontend modifications.  
> **Branch:** `backend/restruc` (Spring Modulith architecture)  
> **Date:** 2026-03-01  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Phase 1 — Security & JWT Overhaul](#3-phase-1--security--jwt-overhaul)
4. [Phase 2 — RBAC & Data Isolation](#4-phase-2--rbac--data-isolation)
5. [Phase 3 — Admin Question Bank](#5-phase-3--admin-question-bank)
6. [Database Schema Updates](#6-database-schema-updates)
7. [Security Flow Diagrams](#7-security-flow-diagrams)
8. [Task Breakdown](#8-task-breakdown)
9. [Testing Strategy](#9-testing-strategy)
10. [Migration & Rollback Plan](#10-migration--rollback-plan)
11. [Appendix — File Inventory](#11-appendix--file-inventory)

---

## 1. Executive Summary

This plan covers three interconnected backend upgrades:

| Phase | Goal | Risk | Effort |
|-------|------|------|--------|
| **Phase 1** | HTTPS + HttpOnly cookie JWT + minimal payload | High (breaking auth flow) | ~3 days |
| **Phase 2** | Strict RBAC with quiz-level data isolation | Medium (authorization regressions) | ~2 days |
| **Phase 3** | Admin Question Bank with auto-archiving | Low (additive feature) | ~2 days |

**Total estimated effort:** 6–8 working days (including testing).

---

## 2. Current State Analysis

### 2.1 Security Baseline

| Aspect | Current State | Risk |
|--------|---------------|------|
| Transport | **HTTP** (port 8090) | Credentials & tokens in cleartext on the wire |
| JWT Storage | Client stores token; sends via `Authorization: Bearer` header | Vulnerable to XSS — token is accessible to JS |
| JWT Payload | Contains `sub` (username), `role`, `iat`, `exp` | Reasonable claims, but 24h expiration is excessive |
| JWT Secret | Hardcoded fallback in `JwtConfig.java` `@Value("${jwt.secret:...}")` | Secret in source code |
| Cookie Auth | **Not implemented** | N/A |
| HTTPS | **Not configured** | All HTTP |
| CSRF | Disabled (`csrf.disable()`) | Acceptable for stateless API, but must be reconsidered with cookies |

### 2.2 RBAC Baseline

| Aspect | Current State | Gap |
|--------|---------------|-----|
| Roles | `SUPER_ADMIN`, `ADMIN` via `SystemRole` enum | No gap — two-tier hierarchy is correct |
| Quiz ownership | **No `createdBy`/`ownerId` on Quiz entity** | Admins cannot be identified as quiz owners |
| Data isolation | `getAllQuizzes()` returns **all** quizzes to any authenticated user | Admins see all quizzes, not just their own |
| Permission model | `QuizAssignment` + `AdminPermission` per-quiz | Exists but is not enforced at controller/service level for quiz CRUD |
| `@PreAuthorize` | Only on `UserController` | Missing on `QuizController`, `QuestionController`, `TeamController`, etc. |

### 2.3 Question Bank Baseline

| Aspect | Current State | Gap |
|--------|---------------|-----|
| Question entity | Always tied to a single `Quiz` via `@ManyToOne` | No independent question storage |
| QuestionBank entity | **Does not exist** | Must be created |
| Reuse mechanism | None — questions are duplicated manually | Need copy/link workflow |

### 2.4 Key Files Affected

| File | Module | Impact |
|------|--------|--------|
| `JwtConfig.java` | auth | JWT generation, signing, claims |
| `JwtAuthenticationFilter.java` | auth | Token extraction: header → cookie |
| `AuthController.java` | auth | Login response: body → cookie |
| `SecurityConfig.java` | auth | HTTPS, CSRF for cookies, filter chain |
| `CorsConfig.java` | auth | `SameSite`, credential settings |
| `Quiz.java` | quiz | Add `createdByUserId` column |
| `QuizController.java` | quiz | Data-isolation filtering |
| `QuestionController.java` | quiz | Question Bank auto-archiving |
| `application.properties` | config | TLS keystore, JWT settings |
| New: `QuestionBankItem.java` | quiz | New entity |
| New: `QuestionBankController.java` | quiz | New REST endpoints |

---

## 3. Phase 1 — Security & JWT Overhaul

### 3.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-1 | Spring Boot serves HTTPS via self-signed certificate on the intranet | Must |
| SEC-2 | JWT payload contains only `sub`, `role`, `iat`, `exp` with ≤ 30 min TTL | Must |
| SEC-3 | Refresh token (opaque, long-lived, HttpOnly cookie) enables silent re-auth | Should |
| SEC-4 | Access token delivered in HttpOnly, Secure, SameSite=Strict cookie | Must |
| SEC-5 | `JwtAuthenticationFilter` reads token from cookie, not `Authorization` header | Must |
| SEC-6 | Login endpoint sets cookies via `Set-Cookie` header, returns only `{ username, role }` in body | Must |
| SEC-7 | Logout endpoint clears cookies (sets Max-Age=0) | Must |
| SEC-8 | CSRF protection re-enabled for cookie-based auth (double-submit or CSRF token) | Should |
| SEC-9 | JWT secret externalized to environment variable, no hardcoded fallback | Must |
| SEC-10 | CORS updated: `allowCredentials(true)`, explicit `allowedOrigins` | Must |

### 3.2 Design — HTTPS Configuration

```properties
# application.properties additions
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore/intelliquiz.p12
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=intelliquiz
server.port=8443
```

**Keystore generation** (one-time setup, committed to `backend/src/main/resources/keystore/`):
```bash
keytool -genkeypair \
  -alias intelliquiz \
  -keyalg RSA -keysize 2048 \
  -storetype PKCS12 \
  -keystore intelliquiz.p12 \
  -validity 3650 \
  -storepass ${SSL_KEYSTORE_PASSWORD} \
  -dname "CN=intelliquiz.local, OU=IntelliQuiz, O=IntelliQuiz, L=Local, S=Dev, C=PH"
```

### 3.3 Design — JWT Payload Optimization

**Current payload:**
```json
{
  "sub": "admin1",
  "role": "ADMIN",
  "iat": 1709251200,
  "exp": 1709337600    // 24 hours
}
```

**Optimized payload:**
```json
{
  "sub": "admin1",
  "role": "ADMIN",
  "uid": 42,
  "iat": 1709251200,
  "exp": 1709253000    // 30 minutes
}
```

Changes:
- Add `uid` (user ID) claim — avoids DB lookup on every request to resolve username → userId
- Reduce TTL from 24h → 30m
- No other claims — keep minimal

**Refresh token** (optional but recommended):
- Opaque UUID stored in DB (`refresh_token` table) or in-memory cache
- 7-day TTL
- Sent in a separate HttpOnly cookie (`intelliquiz_refresh`)
- Endpoint: `POST /api/auth/refresh` → issues new access token cookie

### 3.4 Design — HttpOnly Cookie Implementation

#### Login flow:
```
POST /api/auth/login  { username, password }
  → Validate credentials
  → Generate JWT (30m TTL)
  → Set response cookie:
      Set-Cookie: intelliquiz_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=1800
  → Return body: { username, role }   (NO token in body)
```

#### Authenticated request flow:
```
GET /api/quizzes
  Cookie: intelliquiz_token=<jwt>
  → JwtAuthenticationFilter extracts token from cookie
  → Validates, sets SecurityContext
  → Controller executes
```

#### Logout flow:
```
POST /api/auth/logout
  → Set response cookie:
      Set-Cookie: intelliquiz_token=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0
  → Return 204 No Content
```

### 3.5 Design — JwtAuthenticationFilter Update

```java
// Pseudocode for updated filter
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    String token = extractTokenFromCookie(request, "intelliquiz_token");
    
    // Fallback: also check Authorization header for backward compatibility / WebSocket
    if (token == null) {
        token = extractTokenFromHeader(request);
    }
    
    if (token != null && jwtConfig.validateToken(token)) {
        String username = jwtConfig.extractUsername(token);
        String role = jwtConfig.extractRole(token);
        Long userId = jwtConfig.extractUserId(token);
        
        // Build authentication with userId in details
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        auth.setDetails(Map.of("userId", userId));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
    
    filterChain.doFilter(request, response);
}
```

**Key decision:** Keep `Authorization: Bearer` as a fallback for WebSocket CONNECT frames (STOMP headers don't carry cookies reliably). The filter checks cookie first, then falls back to header.

### 3.6 Design — CSRF Consideration

With HttpOnly cookies, the browser sends the cookie automatically, making CSRF attacks possible. Options:

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **SameSite=Strict cookie** | Simple, strong protection | May break cross-origin flows | **Use this** (intranet = same origin) |
| **Double-submit cookie** | Works cross-origin | More complexity | Not needed for intranet |
| **Spring CSRF token** | Standard approach | Requires frontend changes | Violates backend-only constraint |

**Decision:** Rely on `SameSite=Strict` for CSRF protection. Keep `csrf.disable()` in SecurityConfig since `SameSite=Strict` on an intranet provides equivalent protection without frontend changes.

---

## 4. Phase 2 — RBAC & Data Isolation

### 4.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| RBAC-1 | SUPER_ADMIN can create and manage ADMIN accounts (already implemented) | Done |
| RBAC-2 | ADMIN can create, read, update, delete quizzes | Must |
| RBAC-3 | Quiz entity stores `createdByUserId` — the ADMIN who created it | Must |
| RBAC-4 | ADMIN can only see/modify quizzes where `createdByUserId == currentUserId` | Must |
| RBAC-5 | SUPER_ADMIN can see and modify ALL quizzes | Must |
| RBAC-6 | Data isolation extends to quiz sub-resources: questions, teams, submissions, scoreboard | Must |
| RBAC-7 | `@PreAuthorize` or equivalent enforced on all quiz-related controllers | Must |
| RBAC-8 | Existing `QuizAssignment` / `AdminPermission` model remains for future fine-grained delegation | Should |

### 4.2 Design — Quiz Ownership

#### Entity change: `Quiz.java`

```java
@Entity
@Table(name = "quiz")
public class Quiz {
    // ... existing fields ...
    
    @Column(name = "created_by_user_id")
    private Long createdByUserId;  // FK to User.id (by ID, not entity ref — cross-module)

    // Getter, setter, constructor update
}
```

**Why `Long` instead of `@ManyToOne User`?** The Quiz entity is in the `quiz` module and the User entity is in the `user` module. Spring Modulith prohibits direct entity cross-references. We use the same FK-by-ID pattern already established for `Team.quizId`.

#### Migration: backfill existing quizzes

Existing quizzes have no `created_by_user_id`. Strategy:
1. Add column as **nullable** first
2. Run a data migration to assign existing quizzes to the first SUPER_ADMIN user
3. Alter column to **NOT NULL** after backfill

```sql
-- V2__add_quiz_ownership.sql (if Flyway is enabled) or manual migration
ALTER TABLE quiz ADD COLUMN created_by_user_id BIGINT;
UPDATE quiz SET created_by_user_id = (SELECT id FROM "user" WHERE system_role = 'SUPER_ADMIN' LIMIT 1);
ALTER TABLE quiz ALTER COLUMN created_by_user_id SET NOT NULL;
```

### 4.3 Design — Data Isolation Enforcement

Three complementary layers:

#### Layer 1: Repository-level filtering

Add repository methods that filter by owner:

```java
// SpringQuizRepository.java
List<Quiz> findByCreatedByUserId(Long userId);
Optional<Quiz> findByIdAndCreatedByUserId(Long id, Long userId);
```

#### Layer 2: Service-level isolation

```java
// QuizManagementService.java
public List<Quiz> getQuizzesForUser(Long userId, SystemRole role) {
    if (role == SystemRole.SUPER_ADMIN) {
        return quizRepository.findAll();
    }
    return quizRepository.findByCreatedByUserId(userId);
}

public Quiz getQuizForUser(Long quizId, Long userId, SystemRole role) {
    Quiz quiz = quizRepository.findById(quizId)
        .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
    
    if (role != SystemRole.SUPER_ADMIN && !quiz.getCreatedByUserId().equals(userId)) {
        throw new AccessDeniedException("You do not have access to this quiz");
    }
    return quiz;
}
```

#### Layer 3: Controller-level annotations

```java
// QuizController.java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public ResponseEntity<List<QuizResponse>> getAllQuizzes(Authentication auth) {
    Long userId = extractUserId(auth);
    SystemRole role = extractRole(auth);
    List<Quiz> quizzes = quizManagementService.getQuizzesForUser(userId, role);
    // ...
}
```

#### Helper: extracting userId from SecurityContext

Since we're adding `uid` to the JWT payload (Phase 1), we can extract it from the authentication details:

```java
// Utility method (in a shared SecurityUtils class or base controller)
public static Long extractUserId(Authentication auth) {
    if (auth.getDetails() instanceof Map<?, ?> details) {
        return ((Number) details.get("userId")).longValue();
    }
    throw new IllegalStateException("User ID not found in authentication details");
}
```

### 4.4 Design — Sub-resource Isolation

When an Admin accesses quiz sub-resources (questions, teams, submissions), the system must first verify quiz ownership. The pattern:

```
GET /api/quizzes/{quizId}/questions
  → Verify quiz ownership (service layer)
  → Return questions only if admin owns the quiz
```

**Implementation:** Since `QuestionController`, `TeamController`, etc. all operate within the context of a `quizId`, the ownership check happens once at the quiz-retrieval level. The sub-resource endpoints already receive `quizId` as a path parameter — we just gate the access at the quiz lookup.

### 4.5 Design — Controller Annotation Matrix

| Controller | Endpoint | Current Auth | Target Auth |
|------------|----------|-------------|-------------|
| `QuizController` | `GET /api/quizzes` | `authenticated()` | `@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")` + ownership filter |
| `QuizController` | `GET /api/quizzes/{id}` | `authenticated()` | Same + ownership check |
| `QuizController` | `POST /api/quizzes` | `authenticated()` | `@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")` + set `createdByUserId` |
| `QuizController` | `PUT /api/quizzes/{id}` | `authenticated()` | Same + ownership check |
| `QuizController` | `DELETE /api/quizzes/{id}` | `authenticated()` | Same + ownership check |
| `QuestionController` | All endpoints | `authenticated()` | Ownership check via quiz |
| `TeamController` | All endpoints | `authenticated()` | Ownership check via quiz |
| `BackupController` | All endpoints | `authenticated()` | `@PreAuthorize("hasRole('SUPER_ADMIN')")` |

---

## 5. Phase 3 — Admin Question Bank

### 5.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| QB-1 | Each Admin has a personal Question Bank (collection of reusable questions) | Must |
| QB-2 | When a question is created for a quiz, a copy is automatically archived to the Admin's Question Bank | Must |
| QB-3 | Admins can browse their Question Bank, filtered by type, difficulty, keyword | Must |
| QB-4 | Admins can attach a Question Bank item to a new quiz (copies the question into the quiz) | Must |
| QB-5 | Question Bank items belong to the Admin who created them — isolation enforced | Must |
| QB-6 | Editing a quiz question does NOT retroactively update the Question Bank copy (and vice versa) | Must |
| QB-7 | SUPER_ADMIN can optionally view all Question Bank items (future enhancement) | Should |

### 5.2 Design — Entity Model

#### New entity: `QuestionBankItem`

```java
@Entity
@Table(name = "question_bank_item", indexes = {
    @Index(name = "idx_qbi_owner", columnList = "owner_user_id"),
    @Index(name = "idx_qbi_type", columnList = "question_type"),
    @Index(name = "idx_qbi_difficulty", columnList = "difficulty")
})
public class QuestionBankItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;       // The Admin who owns this bank item

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType type;      // MULTIPLE_CHOICE, IDENTIFICATION

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;   // EASY, MEDIUM, HARD, TIE_BREAKER

    @Column(name = "correct_key", nullable = false)
    private String correctKey;

    private int points;
    
    @Column(name = "time_limit")
    private int timeLimit;

    @ElementCollection
    @CollectionTable(name = "question_bank_option", joinColumns = @JoinColumn(name = "question_bank_item_id"))
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    @Column(name = "source_quiz_id")
    private Long sourceQuizId;      // Quiz where this was first created (null if created directly in bank)

    @Column(name = "source_question_id")
    private Long sourceQuestionId;  // Original question ID (null if created directly in bank)

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // Rich domain methods
    public Question toQuizQuestion(Quiz quiz, int orderIndex) {
        Question q = new Question();
        q.setQuiz(quiz);
        q.setText(this.text);
        q.setType(this.type);
        q.setDifficulty(this.difficulty);
        q.setCorrectKey(this.correctKey);
        q.setPoints(this.points);
        q.setTimeLimit(this.timeLimit);
        q.setOrderIndex(orderIndex);
        q.setOptions(new ArrayList<>(this.options));
        return q;
    }

    public static QuestionBankItem fromQuestion(Question question, Long ownerUserId) {
        QuestionBankItem item = new QuestionBankItem();
        item.setOwnerUserId(ownerUserId);
        item.setText(question.getText());
        item.setType(question.getType());
        item.setDifficulty(question.getDifficulty());
        item.setCorrectKey(question.getCorrectKey());
        item.setPoints(question.getPoints());
        item.setTimeLimit(question.getTimeLimit());
        item.setOptions(new ArrayList<>(question.getOptions()));
        item.setSourceQuizId(question.getQuiz().getId());
        item.setSourceQuestionId(question.getId());
        return item;
    }
}
```

**Key design decisions:**
- **Copy, not reference:** QB items are independent copies. Edits to quiz questions don't affect the bank, and vice versa. This avoids integrity issues when quizzes are deleted.
- **`sourceQuizId` / `sourceQuestionId`:** Traceability only — soft references, not FK constraints.
- **Placed in `quiz` module:** The QuestionBankItem is conceptually part of the quiz domain (it's a question template). Placing it in the `quiz` module avoids a new module and leverages existing `QuestionType`/`Difficulty` enums.

### 5.3 Design — Module Placement

```
quiz/
├── internal/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Quiz.java
│   │   │   ├── Question.java
│   │   │   └── QuestionBankItem.java          ← NEW
│   │   └── ports/
│   │       ├── QuizRepository.java
│   │       ├── QuestionRepository.java
│   │       └── QuestionBankRepository.java    ← NEW
│   ├── application/
│   │   └── services/
│   │       ├── QuestionManagementService.java  ← MODIFIED (auto-archive)
│   │       └── QuestionBankService.java        ← NEW
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── SpringQuestionBankRepository.java  ← NEW
│   └── presentation/
│       ├── controllers/
│       │   └── QuestionBankController.java    ← NEW
│       └── dto/
│           ├── request/
│           │   └── AttachFromBankRequest.java  ← NEW
│           └── response/
│               └── QuestionBankItemResponse.java ← NEW
```

### 5.4 Design — Auto-Archive Workflow

When `POST /api/quizzes/{quizId}/questions` is called:

```
1. QuestionController.createQuestion(quizId, request)
2.   → QuestionManagementService.createQuestion(quizId, command)
3.     → Save Question to quiz (existing flow)
4.     → questionBankService.archiveFromQuiz(savedQuestion, currentUserId)  ← NEW
5.       → QuestionBankItem.fromQuestion(question, userId)
6.       → questionBankRepository.save(bankItem)
```

The archive step is **fire-and-forget** — if it fails, the quiz question creation still succeeds. This can be implemented via:
- **Option A:** Direct call in the same transaction (simple, consistent)
- **Option B:** Spring `@ApplicationEventPublisher` + `@TransactionalEventListener` (decoupled, modulith-aligned)

**Recommendation:** Option A for simplicity since both entities are in the same module.

### 5.5 Design — Question Bank REST API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/question-bank` | List current user's bank items (with optional filters) | ADMIN, SUPER_ADMIN |
| `GET` | `/api/question-bank/{id}` | Get a specific bank item | Owner only |
| `DELETE` | `/api/question-bank/{id}` | Remove a bank item | Owner only |
| `POST` | `/api/quizzes/{quizId}/questions/from-bank` | Copy a bank item into a quiz as a new question | Owner + quiz owner |

**Query parameters for `GET /api/question-bank`:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | String | Filter by `MULTIPLE_CHOICE` or `IDENTIFICATION` |
| `difficulty` | String | Filter by `EASY`, `MEDIUM`, `HARD`, `TIE_BREAKER` |
| `search` | String | Full-text search on `text` field |
| `page` | int | Page number (default 0) |
| `size` | int | Page size (default 20) |

---

## 6. Database Schema Updates

### 6.1 Entity-Relationship Changes

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────────┐
│     User     │       │     Quiz     │       │   QuestionBankItem   │
├──────────────┤       ├──────────────┤       ├──────────────────────┤
│ id        PK │◄──┐   │ id        PK │       │ id               PK │
│ username     │   │   │ title        │       │ owner_user_id    FK │──► User.id
│ password     │   │   │ description  │       │ text               │
│ system_role  │   └───│ created_by_  │       │ question_type      │
│              │       │   user_id FK │       │ difficulty         │
│              │       │ proctor_pin  │       │ correct_key        │
│              │       │ is_live      │       │ points             │
│              │       │ status       │       │ time_limit         │
└──────────────┘       └──────┬───────┘       │ source_quiz_id     │──┐ (soft ref)
       │                      │               │ source_question_id │──┤ (soft ref)
       │                      │               │ created_at         │  │
  ┌────┴─────────┐     ┌──────┴───────┐       └──────────────────────┘  │
  │QuizAssignment│     │   Question   │                                 │
  ├──────────────┤     ├──────────────┤                                 │
  │ id        PK │     │ id        PK │◄────────────────────────────────┘
  │ user_id   FK │     │ quiz_id   FK │
  │ quiz_id      │     │ text         │
  │              │     │ type         │
  └──────────────┘     │ difficulty   │
                       │ correct_key  │
                       │ points       │
                       │ time_limit   │
                       │ order_index  │
                       └──────────────┘
```

### 6.2 New Tables

#### `question_bank_item`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `owner_user_id` | `BIGINT` | NOT NULL, INDEX |
| `text` | `TEXT` | NOT NULL |
| `question_type` | `VARCHAR(30)` | NOT NULL |
| `difficulty` | `VARCHAR(20)` | NULLABLE |
| `correct_key` | `VARCHAR(255)` | NOT NULL |
| `points` | `INT` | NOT NULL DEFAULT 1 |
| `time_limit` | `INT` | NOT NULL DEFAULT 30 |
| `source_quiz_id` | `BIGINT` | NULLABLE |
| `source_question_id` | `BIGINT` | NULLABLE |
| `created_at` | `TIMESTAMP` | NOT NULL |

#### `question_bank_option`
| Column | Type | Constraints |
|--------|------|-------------|
| `question_bank_item_id` | `BIGINT` | FK → `question_bank_item.id`, ON DELETE CASCADE |
| `option_text` | `VARCHAR(500)` | NOT NULL |

### 6.3 Modified Tables

#### `quiz` — add column
| Column | Type | Constraints |
|--------|------|-------------|
| `created_by_user_id` | `BIGINT` | NOT NULL (after backfill) |

#### `refresh_token` (new, optional — Phase 1 if refresh tokens are implemented)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `token` | `VARCHAR(255)` | UNIQUE, NOT NULL |
| `user_id` | `BIGINT` | NOT NULL |
| `expires_at` | `TIMESTAMP` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL |

---

## 7. Security Flow Diagrams

### 7.1 Login Flow (Phase 1)

```
Client                          Backend (HTTPS)
  │                                  │
  │  POST /api/auth/login            │
  │  { username, password }          │
  │─────────────────────────────────►│
  │                                  │  1. Validate credentials
  │                                  │  2. Generate JWT (30m, with uid claim)
  │                                  │  3. Set-Cookie: intelliquiz_token=<jwt>;
  │                                  │     HttpOnly; Secure; SameSite=Strict;
  │                                  │     Path=/api; Max-Age=1800
  │  200 OK                          │
  │  { username, role }              │
  │◄─────────────────────────────────│
  │                                  │
  │  GET /api/quizzes                │
  │  Cookie: intelliquiz_token=<jwt> │
  │─────────────────────────────────►│
  │                                  │  4. JwtAuthenticationFilter:
  │                                  │     - Extract from cookie
  │                                  │     - Validate JWT
  │                                  │     - Set SecurityContext (username, role, uid)
  │                                  │  5. QuizController:
  │                                  │     - Extract uid from context
  │                                  │     - Filter quizzes by ownership
  │  200 OK                          │
  │  [ ...owned quizzes only... ]    │
  │◄─────────────────────────────────│
```

### 7.2 Data Isolation Flow (Phase 2)

```
Admin A (uid=10)                    Backend                           Database
  │                                   │                                  │
  │ GET /api/quizzes                  │                                  │
  │──────────────────────────────────►│                                  │
  │                                   │ SELECT * FROM quiz               │
  │                                   │ WHERE created_by_user_id = 10    │
  │                                   │─────────────────────────────────►│
  │                                   │◄─────────────────────────────────│
  │ 200 [ quiz1, quiz3 ]             │  (only Admin A's quizzes)        │
  │◄──────────────────────────────────│                                  │
  │                                   │                                  │
  │ GET /api/quizzes/5                │                                  │
  │──────────────────────────────────►│                                  │
  │                                   │ quiz5.createdByUserId == 20      │
  │                                   │ ≠ currentUserId 10              │
  │ 403 Forbidden                     │                                  │
  │◄──────────────────────────────────│                                  │
```

### 7.3 Question Bank Auto-Archive Flow (Phase 3)

```
Admin A                             Backend
  │                                   │
  │ POST /api/quizzes/1/questions     │
  │ { text, type, options, ... }      │
  │──────────────────────────────────►│
  │                                   │  1. Verify quiz 1 ownership (Admin A)
  │                                   │  2. Save Question to quiz 1
  │                                   │  3. Auto-archive:
  │                                   │     QuestionBankItem.fromQuestion(q, uid=10)
  │                                   │     → Save to question_bank_item
  │ 201 Created                       │
  │ { questionId, bankItemId }        │
  │◄──────────────────────────────────│
  │                                   │
  │ GET /api/question-bank            │
  │──────────────────────────────────►│
  │                                   │  4. SELECT * FROM question_bank_item
  │                                   │     WHERE owner_user_id = 10
  │ 200 [ ...all Admin A's items... ] │
  │◄──────────────────────────────────│
  │                                   │
  │ POST /api/quizzes/7/questions/    │
  │   from-bank  { bankItemId: 42 }  │
  │──────────────────────────────────►│
  │                                   │  5. Verify quiz 7 ownership
  │                                   │  6. Verify bank item 42 ownership
  │                                   │  7. Copy bank item → new Question in quiz 7
  │ 201 Created                       │
  │◄──────────────────────────────────│
```

---

## 8. Task Breakdown

### Phase 1 — Security & JWT Overhaul

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **1.1** | Generate self-signed PKCS12 keystore; add to `resources/keystore/` | `intelliquiz.p12` (new) | — |
| **1.2** | Add SSL properties to `application.properties` | `application.properties` | 1.1 |
| **1.3** | Externalize JWT secret: remove hardcoded fallback, require `${JWT_SECRET}` env var | `JwtConfig.java`, `.env` | — |
| **1.4** | Add `uid` (userId) claim to JWT generation | `JwtConfig.java` | — |
| **1.5** | Reduce JWT TTL to 30 minutes | `JwtConfig.java`, `application.properties` | — |
| **1.6** | Create `CookieService` utility: `createAccessCookie(token)`, `createClearCookie()` | New: `CookieService.java` | — |
| **1.7** | Update `AuthController.login()`: set HttpOnly cookie, return `{ username, role }` only | `AuthController.java`, `AuthResponse.java` | 1.4, 1.6 |
| **1.8** | Add `POST /api/auth/logout` endpoint: clear cookie | `AuthController.java` | 1.6 |
| **1.9** | Update `JwtAuthenticationFilter`: extract token from cookie first, fallback to header | `JwtAuthenticationFilter.java` | 1.4 |
| **1.10** | Add `uid` extraction to `JwtAuthenticationFilter`, store in `auth.getDetails()` | `JwtAuthenticationFilter.java` | 1.4 |
| **1.11** | Update CORS config: verify `allowCredentials(true)`, remove `Authorization` from exposed headers (no longer needed for cookie auth) | `CorsConfig.java` | 1.7 |
| **1.12** | Update `AuthFacade` and `AuthenticationResultDto` to exclude token from DTO | `AuthFacade.java`, `AuthenticationResultDto.java` | 1.7 |
| **1.13** | Write unit tests for cookie-based auth filter | New test class | 1.9, 1.10 |
| **1.14** | Write integration test: full login → cookie → authenticated request | New test class | 1.7, 1.9 |
| **1.15** | Update `.env.example` with `JWT_SECRET`, `SSL_KEYSTORE_PASSWORD` | `.env.example` | 1.2, 1.3 |

### Phase 2 — RBAC & Data Isolation

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **2.1** | Add `createdByUserId` field to `Quiz` entity | `Quiz.java` | — |
| **2.2** | Write data migration: backfill `created_by_user_id` for existing quizzes | New SQL or `@PostConstruct` migrator | 2.1 |
| **2.3** | Add `findByCreatedByUserId(Long)` to `QuizRepository` / `SpringQuizRepository` | `QuizRepository.java`, `SpringQuizRepository.java` | 2.1 |
| **2.4** | Create `SecurityUtils` class: `extractUserId(Authentication)`, `extractRole(Authentication)` | New: `SecurityUtils.java` in `shared` module | Phase 1.10 |
| **2.5** | Update `QuizManagementService`: add `getQuizzesForUser()`, `getQuizForUser()` with ownership check | `QuizManagementService.java` | 2.1, 2.3 |
| **2.6** | Update `QuizController`: inject `Authentication`, use ownership-filtered methods, add `@PreAuthorize` | `QuizController.java` | 2.4, 2.5 |
| **2.7** | Update `QuestionController`: add ownership check via quiz | `QuestionController.java` | 2.5 |
| **2.8** | Update `TeamController`: add ownership check via quiz | `TeamController.java` | 2.5 |
| **2.9** | Update `QuizFacade`: add ownership-aware methods for cross-module access | `QuizFacade.java` | 2.5 |
| **2.10** | Update `BackupController`: add `@PreAuthorize("hasRole('SUPER_ADMIN')")` | `BackupController.java` | — |
| **2.11** | Update `QuizManagementService.createQuiz()`: set `createdByUserId` from SecurityContext | `QuizManagementService.java` | 2.1, 2.4 |
| **2.12** | Write unit tests for data isolation (admin sees own quizzes only) | New test class | 2.5 |
| **2.13** | Write unit tests for cross-admin access denial | New test class | 2.5 |
| **2.14** | Write unit tests for SUPER_ADMIN bypass (sees all) | New test class | 2.5 |

### Phase 3 — Admin Question Bank

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **3.1** | Create `QuestionBankItem` entity with `@ElementCollection` options | New: `QuestionBankItem.java` | — |
| **3.2** | Create `QuestionBankRepository` port interface | New: `QuestionBankRepository.java` | 3.1 |
| **3.3** | Create `SpringQuestionBankRepository` Spring Data interface | New: `SpringQuestionBankRepository.java` | 3.2 |
| **3.4** | Create `QuestionBankService`: CRUD + query with filtering | New: `QuestionBankService.java` | 3.2 |
| **3.5** | Update `QuestionManagementService.createQuestion()`: call auto-archive after save | `QuestionManagementService.java` | 3.4, Phase 2.4 |
| **3.6** | Create `QuestionBankController`: `GET /api/question-bank`, `GET /{id}`, `DELETE /{id}` | New: `QuestionBankController.java` | 3.4 |
| **3.7** | Create `POST /api/quizzes/{quizId}/questions/from-bank` endpoint (attach from bank) | `QuestionController.java` or `QuestionBankController.java` | 3.4, Phase 2.5 |
| **3.8** | Create request/response DTOs: `QuestionBankItemResponse`, `AttachFromBankRequest` | New DTOs | 3.6 |
| **3.9** | Write unit tests for auto-archive on question creation | New test class | 3.5 |
| **3.10** | Write unit tests for bank item ownership isolation | New test class | 3.4 |
| **3.11** | Write unit tests for attach-from-bank flow | New test class | 3.7 |
| **3.12** | Add Swagger/OpenAPI docs for new endpoints | Annotations in controllers | 3.6, 3.7 |

---

## 9. Testing Strategy

### 9.1 Test Categories

| Category | Scope | Count (est.) |
|----------|-------|-------------|
| Unit (service layer) | Ownership logic, cookie extraction, bank auto-archive | ~15 new tests |
| Property-based (jqwik) | JWT claim extraction, access code resolution with new payload | ~5 new tests |
| Integration | Full HTTP request with cookie auth, data isolation E2E | ~8 new tests |
| Modulith verification | `ApplicationModules.verify()` — ensure no new illegal dependencies | 1 (existing) |

### 9.2 Key Test Scenarios

**Phase 1:**
- JWT generation includes `uid` claim
- JWT with expired token is rejected
- Cookie extraction works when `Authorization` header is absent
- Header fallback works when cookie is absent (WebSocket scenario)
- Login response sets `Set-Cookie` header with correct attributes
- Logout clears the cookie

**Phase 2:**
- Admin A creates quiz → `createdByUserId` is set to Admin A's ID
- Admin A lists quizzes → sees only their own
- Admin A tries to access Admin B's quiz → 403
- SUPER_ADMIN lists quizzes → sees all
- SUPER_ADMIN accesses any quiz → 200
- Admin A accesses questions of Admin B's quiz → 403

**Phase 3:**
- Creating a question auto-archives to the bank
- Admin A's bank items are isolated from Admin B
- Attaching from bank copies the question (not references)
- Deleting a bank item does not affect existing quiz questions
- Deleting a quiz question does not affect the bank item

### 9.3 Regression

The existing 244 tests must remain green after all phases. Run `mvn clean test` after each phase commit.

---

## 10. Migration & Rollback Plan

### 10.1 Database Migration Sequence

| Step | SQL / Action | Reversible? |
|------|-------------|-------------|
| 1 | `ALTER TABLE quiz ADD COLUMN created_by_user_id BIGINT` | `ALTER TABLE quiz DROP COLUMN created_by_user_id` |
| 2 | Backfill: `UPDATE quiz SET created_by_user_id = <super_admin_id>` | No-op (data already there) |
| 3 | `ALTER TABLE quiz ALTER COLUMN created_by_user_id SET NOT NULL` | `ALTER TABLE quiz ALTER COLUMN created_by_user_id DROP NOT NULL` |
| 4 | `CREATE TABLE question_bank_item (...)` | `DROP TABLE question_bank_item` |
| 5 | `CREATE TABLE question_bank_option (...)` | `DROP TABLE question_bank_option` |
| 6 | (Optional) `CREATE TABLE refresh_token (...)` | `DROP TABLE refresh_token` |

### 10.2 Rollback Strategy

Since Flyway is disabled and we use `hibernate.ddl-auto=update`:
- Hibernate will auto-create new columns/tables on startup
- **Rollback = revert code + manually drop the new columns/tables via SQL**
- Consider enabling Flyway for production to get proper versioned migrations

### 10.3 Deployment Order

```
1. Deploy Phase 1 (security)      → Backend restart required
   - Frontend must update to stop reading token from body
   - Cookie auth is automatic (browser handles it)
   
2. Deploy Phase 2 (RBAC)          → Backend restart + DB migration
   - Backfill created_by_user_id before restart
   
3. Deploy Phase 3 (Question Bank) → Backend restart (tables auto-created)
   - New endpoints only, no breaking changes
```

---

## 11. Appendix — File Inventory

### New Files to Create

| # | File | Module | Purpose |
|---|------|--------|---------|
| 1 | `backend/src/main/resources/keystore/intelliquiz.p12` | config | Self-signed TLS cert |
| 2 | `CookieService.java` | auth/internal/infrastructure | Cookie creation helpers |
| 3 | `SecurityUtils.java` | shared | userId/role extraction from SecurityContext |
| 4 | `QuestionBankItem.java` | quiz/internal/domain/entities | Question Bank entity |
| 5 | `QuestionBankRepository.java` | quiz/internal/domain/ports | Port interface |
| 6 | `SpringQuestionBankRepository.java` | quiz/internal/infrastructure/persistence | Spring Data impl |
| 7 | `QuestionBankService.java` | quiz/internal/application/services | Business logic |
| 8 | `QuestionBankController.java` | quiz/internal/presentation/controllers | REST endpoints |
| 9 | `QuestionBankItemResponse.java` | quiz/internal/presentation/dto/response | Response DTO |
| 10 | `AttachFromBankRequest.java` | quiz/internal/presentation/dto/request | Request DTO |

### Existing Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `application.properties` | SSL config, JWT TTL, externalized secret |
| 2 | `JwtConfig.java` | Add `uid` claim, externalize secret, 30m TTL |
| 3 | `JwtAuthenticationFilter.java` | Cookie extraction, uid in details |
| 4 | `AuthController.java` | Cookie-based login, logout endpoint |
| 5 | `AuthResponse.java` | Remove `token` field |
| 6 | `AuthFacade.java` | Update `authenticate()` return |
| 7 | `AuthenticationResultDto.java` | Remove token |
| 8 | `CorsConfig.java` | Adjust for cookie auth |
| 9 | `SecurityConfig.java` | Add logout, HTTPS redirect |
| 10 | `Quiz.java` | Add `createdByUserId` |
| 11 | `QuizManagementService.java` | Ownership filtering, set creator |
| 12 | `QuizController.java` | `@PreAuthorize`, ownership-filtered methods |
| 13 | `QuestionController.java` | Ownership check, auto-archive call |
| 14 | `TeamController.java` | Ownership check via quiz |
| 15 | `BackupController.java` | `@PreAuthorize("hasRole('SUPER_ADMIN')")` |
| 16 | `QuizFacade.java` | Add ownership-aware methods |
| 17 | `SpringQuizRepository.java` | Add `findByCreatedByUserId()` |
| 18 | `QuestionManagementService.java` | Auto-archive hook |
| 19 | `.env` / `.env.example` | New env vars |

---

*End of implementation plan.*
