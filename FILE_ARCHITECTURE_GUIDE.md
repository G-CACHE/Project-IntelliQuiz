# IntelliQuiz - Complete File Architecture Guide
## Spring Modulith with Clean Architecture Inside Modules

> **Architecture**: Spring Modulith modules with Clean Architecture layers inside `internal/`
> **Key Principle**: Simple public API at module root, Clean Architecture inside internal/

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Module Structure Template](#module-structure-template)
3. [All 9 Modules Detailed](#all-9-modules-detailed)
4. [Migration Steps](#migration-steps)
5. [Testing Strategy](#testing-strategy)
6. [File Count & Estimates](#file-count--estimates)

---

## Core Principles

### 1. Module Public API (Root Level)
```
<module>/
├── package-info.java           # @ApplicationModule
├── <Entity>.java               # Domain entities (public)
├── <Service>.java              # Service interfaces (public)
├── <Repository>.java           # Repository interfaces (public)
├── commands/                   # Command DTOs (public)
└── events/                     # Domain events (public)
```

**Everything at root is PUBLIC** - accessible by other modules

### 2. Clean Architecture Inside internal/
```
<module>/
└── internal/                   # Hidden from other modules
    ├── application/            # Use cases, application services
    │   ├── usecases/
    │   └── services/
    ├── domain/                 # Business logic (if separate from public entities)
    │   ├── services/
    │   └── valueobjects/
    ├── infrastructure/         # External concerns
    │   ├── persistence/
    │   ├── config/
    │   └── adapters/
    └── presentation/           # Controllers, DTOs
        ├── controllers/
        └── dto/
```

**Everything in internal/ is HIDDEN** - blocked by Spring Modulith

### 3. Why This Approach?

✅ **Simple public API**: Other modules see clean interfaces
✅ **Clean Architecture inside**: Full separation of concerns within module
✅ **Best of both worlds**: Module boundaries + layered architecture
✅ **Flexibility**: Each module can choose its internal structure

---

## Module Structure Template

```
<module>/
├── package-info.java                           # @ApplicationModule
├── <Entity>.java                               # Domain entities (public, WITH @Entity)
├── <Service>.java                              # Service interface (public)
├── <Repository>.java                           # Repository interface (public)
├── commands/
│   ├── <Command>.java                          # Command DTOs (public)
│   └── package-info.java
├── events/
│   ├── <Event>.java                            # Domain events (public)
│   └── package-info.java
└── internal/                                   # HIDDEN from other modules
    ├── package-info.java
    ├── application/                            # Application layer
    │   ├── usecases/
    │   │   ├── <UseCase>.java                  # Use case implementations
    │   │   └── package-info.java
    │   └── services/
    │       ├── <ServiceImpl>.java              # Service implementations
    │       └── package-info.java
    ├── domain/                                 # Domain layer (optional)
    │   ├── services/
    │   │   ├── <DomainService>.java            # Domain services
    │   │   └── package-info.java
    │   └── valueobjects/
    │       └── <ValueObject>.java
    ├── infrastructure/                         # Infrastructure layer
    │   ├── persistence/
    │   │   ├── Jpa<Entity>Repository.java      # JPA repositories
    │   │   └── package-info.java
    │   ├── config/
    │   │   ├── <Config>.java                   # Configuration
    │   │   └── package-info.java
    │   └── adapters/
    │       └── <Adapter>.java                  # External adapters
    └── presentation/                           # Presentation layer
        ├── controllers/
        │   ├── <Controller>.java               # REST controllers
        │   └── package-info.java
        └── dto/
            ├── <Request>.java                  # Request DTOs
            ├── <Response>.java                 # Response DTOs
            └── package-info.java
```

---

## All 9 Modules Detailed

### Module 1: Shared (Foundation)

**Purpose**: Common utilities, exceptions, enums, value objects

**Structure**:
```
shared/
├── package-info.java
├── exceptions/
│   ├── DomainException.java
│   ├── ResourceNotFoundException.java
│   ├── ValidationException.java
│   ├── AuthorizationException.java
│   └── package-info.java
├── enums/
│   ├── SystemRole.java
│   ├── AdminPermission.java
│   ├── QuizStatus.java
│   ├── QuestionType.java
│   └── package-info.java
├── valueobjects/
│   ├── AccessCode.java
│   ├── TimeWindow.java
│   └── package-info.java
└── services/
    ├── CodeGenerationService.java
    └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Shared Utilities"
)
package com.intelliquiz.api.shared;

import org.springframework.modulith.ApplicationModule;

// exceptions/DomainException.java
public class DomainException extends RuntimeException {
    public DomainException(String message) {
        super(message);
    }
}

// enums/SystemRole.java
public enum SystemRole {
    SUPER_ADMIN,
    ADMIN,
    PARTICIPANT
}

// valueobjects/AccessCode.java
public record AccessCode(String value) {
    public AccessCode {
        if (value == null || value.length() != 6) {
            throw new ValidationException("Access code must be 6 characters");
        }
    }
}
```

**Files**: 15 files
**Effort**: 2 hours

---

### Module 2: Auth (Authentication & Authorization)

**Purpose**: User authentication, authorization, JWT, permissions

**Structure**:
```
auth/
├── package-info.java
├── User.java                                   # Domain entity (public, WITH @Entity)
├── QuizAssignment.java                         # Domain entity (public, WITH @Entity)
├── AuthenticationService.java                  # Service interface (public)
├── AuthorizationService.java                   # Service interface (public)
├── UserRepository.java                         # Repository interface (public)
├── QuizAssignmentRepository.java               # Repository interface (public)
├── commands/
│   ├── CreateUserCommand.java
│   ├── UpdateUserCommand.java
│   └── package-info.java
├── events/
│   ├── UserAuthenticatedEvent.java
│   ├── UserCreatedEvent.java
│   ├── UserUpdatedEvent.java
│   └── package-info.java
└── internal/                                   # HIDDEN
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── AuthenticateUserUseCase.java
    │   │   ├── CheckPermissionUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── AuthenticationServiceImpl.java
    │       ├── AuthorizationServiceImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── PasswordHashingService.java     # Domain service interface
    │       └── package-info.java
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── JpaUserRepository.java
    │   │   ├── JpaQuizAssignmentRepository.java
    │   │   └── package-info.java
    │   ├── config/
    │   │   ├── SecurityConfig.java
    │   │   ├── JwtConfig.java
    │   │   ├── JwtAuthenticationFilter.java
    │   │   └── package-info.java
    │   └── adapters/
    │       ├── BCryptPasswordHashingService.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── AuthController.java
        │   ├── AccessController.java
        │   └── package-info.java
        └── dto/
            ├── LoginRequest.java
            ├── LoginResponse.java
            ├── AuthenticationResult.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Authentication & Authorization",
    allowedDependencies = "shared"
)
package com.intelliquiz.api.auth;

// User.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "\"user\"")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String password;
    
    @Enumerated(EnumType.STRING)
    private SystemRole systemRole;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<QuizAssignment> assignments = new ArrayList<>();
    
    // Rich domain behavior
    public boolean isSuperAdmin() {
        return systemRole == SystemRole.SUPER_ADMIN;
    }
    
    public boolean hasPermissionFor(Quiz quiz, AdminPermission permission) {
        if (isSuperAdmin()) return true;
        return assignments.stream()
            .anyMatch(a -> a.getQuiz().getId().equals(quiz.getId()) 
                && a.hasPermission(permission));
    }
}

// AuthenticationService.java - Service interface (public)
public interface AuthenticationService {
    AuthenticationResult authenticate(String username, String password);
}

// UserRepository.java - Repository interface (public)
public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAll();
    void deleteById(Long id);
}

// internal/application/services/AuthenticationServiceImpl.java
@Service
class AuthenticationServiceImpl implements AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordHashingService passwordHashingService;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public AuthenticationResult authenticate(String username, String password) {
        return userRepository.findByUsername(username)
            .map(user -> verifyPassword(user, password))
            .orElse(AuthenticationResult.failure("Invalid credentials"));
    }
    
    private AuthenticationResult verifyPassword(User user, String password) {
        if (passwordHashingService.matches(password, user.getPassword())) {
            eventPublisher.publishEvent(new UserAuthenticatedEvent(user.getId()));
            return AuthenticationResult.success(user);
        }
        return AuthenticationResult.failure("Invalid credentials");
    }
}

// internal/domain/services/PasswordHashingService.java
interface PasswordHashingService {
    String hash(String plainPassword);
    boolean matches(String plainPassword, String hashedPassword);
}

// internal/infrastructure/adapters/BCryptPasswordHashingService.java
@Service
class BCryptPasswordHashingService implements PasswordHashingService {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    @Override
    public String hash(String plainPassword) {
        return encoder.encode(plainPassword);
    }
    
    @Override
    public boolean matches(String plainPassword, String hashedPassword) {
        return encoder.matches(plainPassword, hashedPassword);
    }
}

// internal/infrastructure/persistence/JpaUserRepository.java
@Repository
interface JpaUserRepository extends UserRepository, JpaRepository<User, Long> {
    // Spring Data provides implementation
}

// internal/presentation/controllers/AuthController.java
@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final AuthenticationService authService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        AuthenticationResult result = authService.authenticate(
            request.username(), 
            request.password()
        );
        
        if (result.isSuccess()) {
            return ResponseEntity.ok(new LoginResponse(result.getToken()));
        }
        return ResponseEntity.status(401).build();
    }
}

// internal/package-info.java
@org.springframework.lang.NonNullApi
package com.intelliquiz.api.auth.internal;
```

**How Other Modules Use Auth**:
```java
// In Quiz module - only sees public API
import com.intelliquiz.api.auth.User;                    // ✅ Public entity
import com.intelliquiz.api.auth.AuthorizationService;    // ✅ Public interface
import com.intelliquiz.api.auth.UserRepository;          // ✅ Public interface

// Cannot see internal implementation
// import com.intelliquiz.api.auth.internal.*;           // ❌ Blocked by Spring Modulith
```

**Files**: 35 files
**Effort**: 8 hours

---

### Module 3: User (User Management)

**Purpose**: User CRUD operations, profile management

**Structure**:
```
user/
├── package-info.java
├── UserManagementService.java                  # Service interface (public)
├── commands/
│   ├── CreateUserCommand.java
│   ├── UpdateUserCommand.java
│   └── package-info.java
├── events/
│   ├── UserCreatedEvent.java
│   ├── UserUpdatedEvent.java
│   ├── UserDeletedEvent.java
│   └── package-info.java
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── CreateUserUseCase.java
    │   │   ├── UpdateUserUseCase.java
    │   │   ├── DeleteUserUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── UserManagementServiceImpl.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── UserController.java
        │   └── package-info.java
        └── dto/
            ├── CreateUserRequest.java
            ├── UserResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "User Management",
    allowedDependencies = {"shared", "auth"}
)
package com.intelliquiz.api.user;

// UserManagementService.java - Service interface (public)
public interface UserManagementService {
    User createUser(CreateUserCommand cmd);
    User updateUser(Long id, UpdateUserCommand cmd);
    void deleteUser(Long id);
    List<User> getAllUsers();
}

// internal/application/services/UserManagementServiceImpl.java
@Service
class UserManagementServiceImpl implements UserManagementService {
    private final UserRepository userRepository;
    private final PasswordHashingService passwordHashingService;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public User createUser(CreateUserCommand cmd) {
        if (userRepository.existsByUsername(cmd.username())) {
            throw new ValidationException("Username already exists");
        }
        
        String hashedPassword = passwordHashingService.hash(cmd.password());
        User user = new User(cmd.username(), hashedPassword, cmd.systemRole());
        User saved = userRepository.save(user);
        
        eventPublisher.publishEvent(new UserCreatedEvent(saved.getId()));
        return saved;
    }
    
    @Override
    public User updateUser(Long id, UpdateUserCommand cmd) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.updateProfile(cmd.username(), cmd.systemRole());
        User updated = userRepository.save(user);
        
        eventPublisher.publishEvent(new UserUpdatedEvent(updated.getId()));
        return updated;
    }
    
    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        eventPublisher.publishEvent(new UserDeletedEvent(id));
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}

// internal/presentation/controllers/UserController.java
@RestController
@RequestMapping("/api/users")
class UserController {
    private final UserManagementService userService;
    
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUser(new CreateUserCommand(
            request.username(),
            request.password(),
            request.systemRole()
        ));
        return ResponseEntity.ok(UserResponse.from(user));
    }
}
```

**Files**: 15 files
**Effort**: 4 hours

---

### Module 4: Quiz (Quiz & Question Management)

**Purpose**: Quiz and question CRUD, quiz lifecycle management

**Structure**:
```
quiz/
├── package-info.java
├── Quiz.java                                   # Domain entity (public, WITH @Entity)
├── Question.java                               # Domain entity (public, WITH @Entity)
├── QuizService.java                            # Service interface (public)
├── QuestionService.java                        # Service interface (public)
├── QuizRepository.java                         # Repository interface (public)
├── QuestionRepository.java                     # Repository interface (public)
├── commands/
│   ├── CreateQuizCommand.java
│   ├── UpdateQuizCommand.java
│   ├── CreateQuestionCommand.java
│   ├── UpdateQuestionCommand.java
│   └── package-info.java
├── events/
│   ├── QuizCreatedEvent.java
│   ├── QuizActivatedEvent.java
│   ├── QuizDeactivatedEvent.java
│   ├── QuestionAddedEvent.java
│   └── package-info.java
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── CreateQuizUseCase.java
    │   │   ├── ActivateQuizUseCase.java
    │   │   ├── CreateQuestionUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── QuizServiceImpl.java
    │       ├── QuestionServiceImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── QuizValidationService.java
    │       └── package-info.java
    ├── infrastructure/
    │   └── persistence/
    │       ├── JpaQuizRepository.java
    │       ├── JpaQuestionRepository.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── QuizController.java
        │   ├── QuestionController.java
        │   └── package-info.java
        └── dto/
            ├── CreateQuizRequest.java
            ├── QuizResponse.java
            ├── QuestionResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Quiz Management",
    allowedDependencies = {"shared", "auth"}
)
package com.intelliquiz.api.quiz;

// Quiz.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "quiz")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    
    @Enumerated(EnumType.STRING)
    private QuizStatus status;
    
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<Question> questions = new ArrayList<>();
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Rich domain behavior
    public void activate() {
        if (questions.isEmpty()) {
            throw new DomainException("Cannot activate quiz without questions");
        }
        if (status == QuizStatus.ACTIVE) {
            throw new DomainException("Quiz is already active");
        }
        this.status = QuizStatus.ACTIVE;
    }
    
    public void deactivate() {
        if (status != QuizStatus.ACTIVE) {
            throw new DomainException("Quiz is not active");
        }
        this.status = QuizStatus.INACTIVE;
    }
    
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this);
    }
    
    public boolean isActive() {
        return status == QuizStatus.ACTIVE;
    }
}

// Question.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "question")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;
    
    private String text;
    
    @Enumerated(EnumType.STRING)
    private QuestionType type;
    
    @ElementCollection
    private List<String> options = new ArrayList<>();
    
    private String correctAnswer;
    private Integer points;
    private Integer orderIndex;
    
    public void validate() {
        if (type == QuestionType.MULTIPLE_CHOICE && options.size() < 2) {
            throw new ValidationException("Multiple choice questions need at least 2 options");
        }
    }
}

// QuizService.java - Service interface (public)
public interface QuizService {
    Quiz createQuiz(CreateQuizCommand cmd, User user);
    Quiz updateQuiz(Long id, UpdateQuizCommand cmd, User user);
    void activateQuiz(Long id, User user);
    void deactivateQuiz(Long id, User user);
    Quiz getQuizById(Long id);
    List<Quiz> getAllQuizzes();
}

// internal/application/services/QuizServiceImpl.java
@Service
class QuizServiceImpl implements QuizService {
    private final QuizRepository quizRepository;
    private final AuthorizationService authzService;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public Quiz createQuiz(CreateQuizCommand cmd, User user) {
        authzService.checkPermission(user, null, AdminPermission.CREATE);
        
        Quiz quiz = new Quiz(cmd.title(), cmd.description());
        Quiz saved = quizRepository.save(quiz);
        
        eventPublisher.publishEvent(new QuizCreatedEvent(saved.getId()));
        return saved;
    }
    
    @Override
    public void activateQuiz(Long id, User user) {
        Quiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        authzService.checkPermission(user, quiz, AdminPermission.ACTIVATE);
        
        quiz.activate();
        quizRepository.save(quiz);
        
        eventPublisher.publishEvent(new QuizActivatedEvent(quiz.getId()));
    }
}

// internal/domain/services/QuizValidationService.java
@Service
class QuizValidationService {
    public void validateQuizForActivation(Quiz quiz) {
        if (quiz.getQuestions().isEmpty()) {
            throw new ValidationException("Quiz must have at least one question");
        }
        
        for (Question question : quiz.getQuestions()) {
            question.validate();
        }
    }
}

// internal/infrastructure/persistence/JpaQuizRepository.java
@Repository
interface JpaQuizRepository extends QuizRepository, JpaRepository<Quiz, Long> {
    // Spring Data provides implementation
}

// internal/presentation/controllers/QuizController.java
@RestController
@RequestMapping("/api/quizzes")
class QuizController {
    private final QuizService quizService;
    
    @PostMapping
    public ResponseEntity<QuizResponse> createQuiz(
        @RequestBody CreateQuizRequest request,
        @AuthenticationPrincipal User user
    ) {
        Quiz quiz = quizService.createQuiz(
            new CreateQuizCommand(request.title(), request.description()),
            user
        );
        return ResponseEntity.ok(QuizResponse.from(quiz));
    }
    
    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateQuiz(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        quizService.activateQuiz(id, user);
        return ResponseEntity.ok().build();
    }
}
```

**Files**: 30 files
**Effort**: 8 hours

---

### Module 5: Team (Team Management)

**Purpose**: Team registration, access code management

**Structure**:
```
team/
├── package-info.java
├── Team.java                                   # Domain entity (public, WITH @Entity)
├── TeamService.java                            # Service interface (public)
├── TeamRepository.java                         # Repository interface (public)
├── events/
│   ├── TeamRegisteredEvent.java
│   ├── TeamJoinedQuizEvent.java
│   └── package-info.java
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── RegisterTeamUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── TeamServiceImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── AccessCodeValidationService.java
    │       └── package-info.java
    ├── infrastructure/
    │   └── persistence/
    │       ├── JpaTeamRepository.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── TeamController.java
        │   └── package-info.java
        └── dto/
            ├── RegisterTeamRequest.java
            ├── TeamResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Team Management",
    allowedDependencies = {"shared", "quiz"}
)
package com.intelliquiz.api.team;

// Team.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "team")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;
    
    private String accessCode;
    private LocalDateTime registeredAt;
    
    public Team(String name, Quiz quiz, String accessCode) {
        this.name = name;
        this.quiz = quiz;
        this.accessCode = accessCode;
        this.registeredAt = LocalDateTime.now();
    }
    
    public boolean matchesAccessCode(String code) {
        return this.accessCode.equals(code);
    }
}

// TeamService.java - Service interface (public)
public interface TeamService {
    Team registerTeam(String teamName, Long quizId, String accessCode);
    List<Team> getTeamsByQuiz(Long quizId);
    Team getTeamById(Long id);
}

// internal/application/services/TeamServiceImpl.java
@Service
class TeamServiceImpl implements TeamService {
    private final TeamRepository teamRepository;
    private final QuizRepository quizRepository;
    private final AccessCodeValidationService accessCodeValidator;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public Team registerTeam(String teamName, Long quizId, String accessCode) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        if (!quiz.isActive()) {
            throw new ValidationException("Quiz is not active");
        }
        
        accessCodeValidator.validate(quiz, accessCode);
        
        if (teamRepository.existsByNameAndQuizId(teamName, quizId)) {
            throw new ValidationException("Team name already taken");
        }
        
        Team team = new Team(teamName, quiz, accessCode);
        Team saved = teamRepository.save(team);
        
        eventPublisher.publishEvent(new TeamRegisteredEvent(saved.getId(), quizId));
        return saved;
    }
}

// internal/domain/services/AccessCodeValidationService.java
@Service
class AccessCodeValidationService {
    public void validate(Quiz quiz, String accessCode) {
        if (!quiz.getAccessCode().equals(accessCode)) {
            throw new ValidationException("Invalid access code");
        }
    }
}
```

**Files**: 18 files
**Effort**: 4 hours

---

### Module 6: Submission (Answer Submission & Validation)

**Purpose**: Answer submission, validation, scoring

**Structure**:
```
submission/
├── package-info.java
├── Submission.java                             # Domain entity (public, WITH @Entity)
├── SubmissionService.java                      # Service interface (public)
├── SubmissionRepository.java                   # Repository interface (public)
├── events/
│   ├── SubmissionReceivedEvent.java
│   ├── SubmissionValidatedEvent.java
│   └── package-info.java
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── SubmitAnswerUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── SubmissionServiceImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── AnswerValidationService.java
    │       ├── ScoringService.java
    │       └── package-info.java
    ├── infrastructure/
    │   └── persistence/
    │       ├── JpaSubmissionRepository.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── SubmissionController.java
        │   └── package-info.java
        └── dto/
            ├── SubmitAnswerRequest.java
            ├── SubmissionResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Submission Management",
    allowedDependencies = {"shared", "quiz", "team"}
)
package com.intelliquiz.api.submission;

// Submission.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "submission")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
    
    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;
    
    private String answer;
    private Boolean isCorrect;
    private Integer pointsAwarded;
    private LocalDateTime submittedAt;
    
    public void validate(Question question) {
        this.isCorrect = question.getCorrectAnswer().equalsIgnoreCase(this.answer);
        this.pointsAwarded = this.isCorrect ? question.getPoints() : 0;
    }
    
    public boolean isCorrect() {
        return Boolean.TRUE.equals(isCorrect);
    }
}

// SubmissionService.java - Service interface (public)
public interface SubmissionService {
    Submission submitAnswer(Long teamId, Long questionId, String answer);
    List<Submission> getSubmissionsByTeam(Long teamId);
    List<Submission> getSubmissionsByQuestion(Long questionId);
}

// internal/domain/services/AnswerValidationService.java
@Service
class AnswerValidationService {
    public boolean isCorrect(String answer, String correctAnswer, QuestionType type) {
        return switch (type) {
            case MULTIPLE_CHOICE, TRUE_FALSE -> 
                answer.equalsIgnoreCase(correctAnswer);
            case SHORT_ANSWER -> 
                normalizeAnswer(answer).equals(normalizeAnswer(correctAnswer));
        };
    }
    
    private String normalizeAnswer(String answer) {
        return answer.trim().toLowerCase();
    }
}

// internal/domain/services/ScoringService.java
@Service
class ScoringService {
    public int calculatePoints(Question question, boolean isCorrect) {
        return isCorrect ? question.getPoints() : 0;
    }
}
```

**Files**: 20 files
**Effort**: 5 hours

---

### Module 7: Scoreboard (CQRS Read Model)

**Purpose**: Real-time scoreboard, leaderboard queries (CQRS pattern)

**Structure**:
```
scoreboard/
├── package-info.java
├── ScoreboardReadModel.java                    # Read model (public, WITH @Entity)
├── ScoreboardQueryService.java                 # Query service interface (public)
├── ScoreboardReadRepository.java               # Repository interface (public)
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── projections/
    │   │   ├── ScoreboardProjection.java       # Event listener
    │   │   └── package-info.java
    │   └── services/
    │       ├── ScoreboardQueryServiceImpl.java
    │       ├── RankCalculationService.java
    │       └── package-info.java
    ├── infrastructure/
    │   └── persistence/
    │       ├── JpaScoreboardReadRepository.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── ScoreboardController.java
        │   └── package-info.java
        └── dto/
            ├── ScoreboardResponse.java
            ├── LeaderboardResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Scoreboard",
    allowedDependencies = {"shared", "submission", "team"}
)
package com.intelliquiz.api.scoreboard;

// ScoreboardReadModel.java - Read model (public, WITH @Entity)
@Entity
@Table(name = "scoreboard_read_model")
public class ScoreboardReadModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long quizId;
    private Long teamId;
    private String teamName;
    private Integer totalScore;
    private Integer correctAnswers;
    private Integer totalAnswers;
    private Integer rank;
    private LocalDateTime lastUpdated;
    
    public void updateScore(int pointsAwarded, boolean isCorrect) {
        this.totalScore += pointsAwarded;
        this.totalAnswers++;
        if (isCorrect) {
            this.correctAnswers++;
        }
        this.lastUpdated = LocalDateTime.now();
    }
}

// ScoreboardQueryService.java - Query service interface (public)
public interface ScoreboardQueryService {
    List<ScoreboardReadModel> getLeaderboard(Long quizId);
    ScoreboardReadModel getTeamScore(Long teamId);
    void recalculateRanks(Long quizId);
}

// internal/application/projections/ScoreboardProjection.java
@Service
class ScoreboardProjection {
    private final ScoreboardReadRepository readRepository;
    private final ScoreboardQueryService queryService;
    
    @EventListener
    @Async
    public void on(SubmissionReceivedEvent event) {
        ScoreboardReadModel score = readRepository.findByTeamId(event.teamId())
            .orElseGet(() -> createNewScore(event.teamId()));
        
        score.updateScore(event.pointsAwarded(), event.isCorrect());
        readRepository.save(score);
        
        // Recalculate ranks asynchronously
        queryService.recalculateRanks(score.getQuizId());
    }
    
    @EventListener
    public void on(TeamRegisteredEvent event) {
        ScoreboardReadModel score = new ScoreboardReadModel(
            event.quizId(),
            event.teamId(),
            event.teamName()
        );
        readRepository.save(score);
    }
    
    private ScoreboardReadModel createNewScore(Long teamId) {
        // Fetch team details and create new score
        return new ScoreboardReadModel();
    }
}

// internal/application/services/RankCalculationService.java
@Service
class RankCalculationService {
    public void calculateRanks(List<ScoreboardReadModel> scores) {
        scores.sort(Comparator.comparing(ScoreboardReadModel::getTotalScore).reversed());
        
        int rank = 1;
        for (ScoreboardReadModel score : scores) {
            score.setRank(rank++);
        }
    }
}
```

**Files**: 16 files
**Effort**: 6 hours

---

### Module 8: Backup (Backup & Restore)

**Purpose**: Database backup, restore operations

**Structure**:
```
backup/
├── package-info.java
├── BackupRecord.java                           # Domain entity (public, WITH @Entity)
├── BackupService.java                          # Service interface (public)
├── BackupRepository.java                       # Repository interface (public)
├── events/
│   ├── BackupCreatedEvent.java
│   ├── BackupRestoredEvent.java
│   └── package-info.java
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── CreateBackupUseCase.java
    │   │   ├── RestoreBackupUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── BackupServiceImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── BackupValidationService.java
    │       └── package-info.java
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── JpaBackupRepository.java
    │   │   └── package-info.java
    │   └── adapters/
    │       ├── BackupStorageService.java
    │       ├── DatabaseBackupAdapter.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── BackupController.java
        │   └── package-info.java
        └── dto/
            ├── BackupResponse.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Backup Management",
    allowedDependencies = {"shared", "auth"}
)
package com.intelliquiz.api.backup;

// BackupRecord.java - Domain entity (public, WITH @Entity)
@Entity
@Table(name = "backup_record")
public class BackupRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String filename;
    private String filePath;
    private Long fileSize;
    private LocalDateTime createdAt;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}

// BackupService.java - Service interface (public)
public interface BackupService {
    BackupRecord createBackup(User user);
    void restoreBackup(Long backupId, User user);
    List<BackupRecord> getAllBackups();
}

// internal/infrastructure/adapters/DatabaseBackupAdapter.java
@Service
class DatabaseBackupAdapter {
    private final String backupDirectory;
    
    public String executeBackup(String filename) {
        // Execute pg_dump or mysqldump
        String filePath = backupDirectory + "/" + filename;
        ProcessBuilder pb = new ProcessBuilder(
            "pg_dump",
            "-U", "postgres",
            "-f", filePath,
            "intelliquiz"
        );
        // ... execute and return path
        return filePath;
    }
    
    public void executeRestore(String filePath) {
        // Execute psql or mysql restore
        ProcessBuilder pb = new ProcessBuilder(
            "psql",
            "-U", "postgres",
            "-f", filePath,
            "intelliquiz"
        );
        // ... execute restore
    }
}
```

**Files**: 22 files
**Effort**: 5 hours

---

### Module 9: Realtime (WebSocket & Game Flow)

**Purpose**: WebSocket communication, real-time game state, timer management

**Structure**:
```
realtime/
├── package-info.java
├── GameState.java                              # Domain model (public, NOT @Entity)
├── BroadcastService.java                       # Service interface (public)
├── GameFlowService.java                        # Service interface (public)
├── TimerService.java                           # Service interface (public)
├── SessionManager.java                         # Service interface (public)
└── internal/
    ├── package-info.java
    ├── application/
    │   ├── usecases/
    │   │   ├── StartQuizUseCase.java
    │   │   ├── StartQuestionUseCase.java
    │   │   ├── EndQuestionUseCase.java
    │   │   └── package-info.java
    │   └── services/
    │       ├── BroadcastServiceImpl.java
    │       ├── GameFlowServiceImpl.java
    │       ├── TimerServiceImpl.java
    │       ├── SessionManagerImpl.java
    │       └── package-info.java
    ├── domain/
    │   └── services/
    │       ├── GameStateManager.java
    │       ├── TimerCoordinator.java
    │       └── package-info.java
    ├── infrastructure/
    │   ├── config/
    │   │   ├── WebSocketConfig.java
    │   │   └── package-info.java
    │   └── adapters/
    │       ├── WebSocketMessagingAdapter.java
    │       └── package-info.java
    └── presentation/
        ├── controllers/
        │   ├── WebSocketController.java
        │   └── package-info.java
        └── dto/
            ├── GameStateMessage.java
            ├── TimerMessage.java
            ├── ScoreUpdateMessage.java
            └── package-info.java
```

**Key Files**:

```java
// package-info.java
@ApplicationModule(
    displayName = "Real-time Communication",
    allowedDependencies = {"shared", "quiz", "team", "submission", "scoreboard"}
)
package com.intelliquiz.api.realtime;

// GameState.java - Domain model (public, NOT @Entity - in-memory)
public class GameState {
    private Long quizId;
    private Long currentQuestionId;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private LocalDateTime questionStartedAt;
    private Integer timeRemaining;
    private GameStatus status;
    
    public void startQuestion(Question question, int timeLimit) {
        this.currentQuestionId = question.getId();
        this.questionStartedAt = LocalDateTime.now();
        this.timeRemaining = timeLimit;
        this.status = GameStatus.QUESTION_ACTIVE;
    }
    
    public void endQuestion() {
        this.status = GameStatus.QUESTION_ENDED;
        this.timeRemaining = 0;
    }
    
    public boolean isQuestionActive() {
        return status == GameStatus.QUESTION_ACTIVE;
    }
}

// BroadcastService.java - Service interface (public)
public interface BroadcastService {
    void broadcastGameState(Long quizId, GameState state);
    void broadcastTimerUpdate(Long quizId, int timeRemaining);
    void broadcastScoreUpdate(Long quizId, ScoreboardReadModel score);
}

// GameFlowService.java - Service interface (public)
public interface GameFlowService {
    void startQuiz(Long quizId);
    void startQuestion(Long quizId, Question question);
    void endQuestion(Long quizId);
    void endQuiz(Long quizId);
}

// internal/application/services/BroadcastServiceImpl.java
@Service
class BroadcastServiceImpl implements BroadcastService {
    private final SimpMessagingTemplate messagingTemplate;
    
    @Override
    public void broadcastGameState(Long quizId, GameState state) {
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + quizId + "/state",
            GameStateMessage.from(state)
        );
    }
    
    @Override
    public void broadcastTimerUpdate(Long quizId, int timeRemaining) {
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + quizId + "/timer",
            new TimerMessage(timeRemaining)
        );
    }
    
    @Override
    public void broadcastScoreUpdate(Long quizId, ScoreboardReadModel score) {
        messagingTemplate.convertAndSend(
            "/topic/quiz/" + quizId + "/scores",
            ScoreUpdateMessage.from(score)
        );
    }
}

// internal/application/services/GameFlowServiceImpl.java
@Service
class GameFlowServiceImpl implements GameFlowService {
    private final QuizRepository quizRepository;
    private final BroadcastService broadcastService;
    private final TimerService timerService;
    private final SessionManager sessionManager;
    private final GameStateManager gameStateManager;
    
    @Override
    public void startQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        if (!quiz.isActive()) {
            throw new ValidationException("Quiz is not active");
        }
        
        GameState state = gameStateManager.createGameState(quiz);
        sessionManager.createSession(quizId, state);
        
        // Start first question
        Question firstQuestion = quiz.getQuestions().get(0);
        startQuestion(quizId, firstQuestion);
    }
    
    @Override
    public void startQuestion(Long quizId, Question question) {
        GameState state = sessionManager.getSession(quizId)
            .orElseThrow(() -> new IllegalStateException("No active session"));
        
        state.startQuestion(question, 30); // 30 seconds per question
        broadcastService.broadcastGameState(quizId, state);
        
        // Start timer
        timerService.startTimer(quizId, 30, () -> endQuestion(quizId));
    }
    
    @Override
    public void endQuestion(Long quizId) {
        GameState state = sessionManager.getSession(quizId)
            .orElseThrow(() -> new IllegalStateException("No active session"));
        
        state.endQuestion();
        broadcastService.broadcastGameState(quizId, state);
        
        // Move to next question or end quiz
        gameStateManager.moveToNextQuestion(quizId, state);
    }
}

// internal/application/services/TimerServiceImpl.java
@Service
class TimerServiceImpl implements TimerService {
    private final Map<Long, ScheduledFuture<?>> timers = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    private final BroadcastService broadcastService;
    
    @Override
    public void startTimer(Long quizId, int seconds, Runnable onComplete) {
        cancelTimer(quizId);
        
        AtomicInteger remaining = new AtomicInteger(seconds);
        
        ScheduledFuture<?> timer = scheduler.scheduleAtFixedRate(() -> {
            int time = remaining.decrementAndGet();
            broadcastService.broadcastTimerUpdate(quizId, time);
            
            if (time <= 0) {
                cancelTimer(quizId);
                onComplete.run();
            }
        }, 0, 1, TimeUnit.SECONDS);
        
        timers.put(quizId, timer);
    }
    
    @Override
    public void cancelTimer(Long quizId) {
        ScheduledFuture<?> timer = timers.remove(quizId);
        if (timer != null) {
            timer.cancel(false);
        }
    }
}

// internal/domain/services/GameStateManager.java
@Service
class GameStateManager {
    public GameState createGameState(Quiz quiz) {
        GameState state = new GameState();
        state.setQuizId(quiz.getId());
        state.setTotalQuestions(quiz.getQuestions().size());
        state.setCurrentQuestionIndex(0);
        state.setStatus(GameStatus.NOT_STARTED);
        return state;
    }
    
    public void moveToNextQuestion(Long quizId, GameState state) {
        int nextIndex = state.getCurrentQuestionIndex() + 1;
        
        if (nextIndex >= state.getTotalQuestions()) {
            state.setStatus(GameStatus.COMPLETED);
        } else {
            state.setCurrentQuestionIndex(nextIndex);
        }
    }
}

// internal/infrastructure/config/WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("*")
            .withSockJS();
    }
}

// internal/presentation/controllers/WebSocketController.java
@Controller
class WebSocketController {
    private final GameFlowService gameFlowService;
    
    @MessageMapping("/quiz/{quizId}/start")
    public void startQuiz(@DestinationVariable Long quizId) {
        gameFlowService.startQuiz(quizId);
    }
    
    @MessageMapping("/quiz/{quizId}/next")
    public void nextQuestion(@DestinationVariable Long quizId) {
        gameFlowService.endQuestion(quizId);
    }
}
```

**Event Listeners** (listen to other modules):
```java
// In internal/application/services/GameFlowServiceImpl.java
@EventListener
public void on(SubmissionReceivedEvent event) {
    // Broadcast submission to all participants
    broadcastService.broadcastSubmissionReceived(event.teamId(), event.questionId());
}

@EventListener
public void on(ScoreboardUpdatedEvent event) {
    // Broadcast score update
    ScoreboardReadModel score = scoreboardQueryService.getTeamScore(event.teamId());
    broadcastService.broadcastScoreUpdate(event.quizId(), score);
}
```

**Files**: 28 files
**Effort**: 10 hours

---


## Migration Steps

### Phase 1: Setup & Shared Module (Week 1)

#### Step 1.1: Create Module Structure (3 hours)
```bash
cd backend/src/main/java/com/intelliquiz/api

# Create all module directories with Clean Architecture layers
mkdir -p shared/{exceptions,enums,valueobjects,services}

mkdir -p auth/{commands,events,internal/{application/{usecases,services},domain/services,infrastructure/{persistence,config,adapters},presentation/{controllers,dto}}}

mkdir -p user/{commands,events,internal/{application/{usecases,services},presentation/{controllers,dto}}}

mkdir -p quiz/{commands,events,internal/{application/{usecases,services},domain/services,infrastructure/persistence,presentation/{controllers,dto}}}

mkdir -p team/{events,internal/{application/{usecases,services},domain/services,infrastructure/persistence,presentation/{controllers,dto}}}

mkdir -p submission/{events,internal/{application/{usecases,services},domain/services,infrastructure/persistence,presentation/{controllers,dto}}}

mkdir -p scoreboard/internal/{application/{projections,services},infrastructure/persistence,presentation/{controllers,dto}}

mkdir -p backup/{events,internal/{application/{usecases,services},domain/services,infrastructure/{persistence,adapters},presentation/{controllers,dto}}}

mkdir -p realtime/internal/{application/{usecases,services},domain/services,infrastructure/{config,adapters},presentation/{controllers,dto}}
```

#### Step 1.2: Migrate Shared Module (4 hours)
```bash
# Move exceptions
mv domain/exceptions/* shared/exceptions/

# Move enums
mv domain/enums/* shared/enums/

# Move value objects
mv domain/valueobjects/* shared/valueobjects/

# Move shared services
mv domain/services/CodeGenerationService.java shared/services/

# Create package-info.java
cat > shared/package-info.java << 'EOF'
@ApplicationModule(
    displayName = "Shared Utilities"
)
package com.intelliquiz.api.shared;

import org.springframework.modulith.ApplicationModule;
EOF
```

---

### Phase 2: Auth Module (Week 1-2)

#### Step 2.1: Move Domain Entities to Public API (2 hours)
```bash
# Move entities to module root (public)
mv domain/entities/User.java auth/
mv domain/entities/QuizAssignment.java auth/

# Update package declarations
sed -i 's/package com.intelliquiz.api.domain.entities/package com.intelliquiz.api.auth/' auth/User.java
sed -i 's/package com.intelliquiz.api.domain.entities/package com.intelliquiz.api.auth/' auth/QuizAssignment.java
```

#### Step 2.2: Create Public Service Interfaces (2 hours)
```bash
# Create AuthenticationService.java interface at module root
cat > auth/AuthenticationService.java << 'EOF'
package com.intelliquiz.api.auth;

public interface AuthenticationService {
    AuthenticationResult authenticate(String username, String password);
}
EOF

# Create AuthorizationService.java interface at module root
cat > auth/AuthorizationService.java << 'EOF'
package com.intelliquiz.api.auth;

public interface AuthorizationService {
    void checkPermission(User user, Quiz quiz, AdminPermission permission);
    boolean hasPermission(User user, Quiz quiz, AdminPermission permission);
}
EOF

# Create repository interfaces at module root
cat > auth/UserRepository.java << 'EOF'
package com.intelliquiz.api.auth;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAll();
    void deleteById(Long id);
}
EOF
```

#### Step 2.3: Move Service Implementations to internal/application/services (3 hours)
```bash
# Move service implementations to internal/application/services
mv application/services/AuthenticationService.java auth/internal/application/services/AuthenticationServiceImpl.java
mv application/services/AuthorizationService.java auth/internal/application/services/AuthorizationServiceImpl.java

# Update class names and package declarations
sed -i 's/class AuthenticationService/class AuthenticationServiceImpl/' auth/internal/application/services/AuthenticationServiceImpl.java
sed -i 's/package com.intelliquiz.api.application.services/package com.intelliquiz.api.auth.internal.application.services/' auth/internal/application/services/AuthenticationServiceImpl.java

# Add implements clause
sed -i 's/class AuthenticationServiceImpl/class AuthenticationServiceImpl implements AuthenticationService/' auth/internal/application/services/AuthenticationServiceImpl.java
```

#### Step 2.4: Move Infrastructure to internal/infrastructure (2 hours)
```bash
# Move JPA repositories to internal/infrastructure/persistence
mv infrastructure/persistence/JpaUserRepository.java auth/internal/infrastructure/persistence/
mv infrastructure/persistence/JpaQuizAssignmentRepository.java auth/internal/infrastructure/persistence/

# Move security config to internal/infrastructure/config
mv infrastructure/config/SecurityConfig.java auth/internal/infrastructure/config/
mv infrastructure/config/JwtConfig.java auth/internal/infrastructure/config/
mv infrastructure/config/JwtAuthenticationFilter.java auth/internal/infrastructure/config/

# Move password hashing to internal/infrastructure/adapters
mv infrastructure/security/BCryptPasswordHashingService.java auth/internal/infrastructure/adapters/

# Update package declarations
find auth/internal/infrastructure -name "*.java" -exec sed -i 's/package com.intelliquiz.api.infrastructure/package com.intelliquiz.api.auth.internal.infrastructure/' {} \;
```

#### Step 2.5: Move Controllers to internal/presentation (2 hours)
```bash
# Move controllers to internal/presentation/controllers
mv presentation/controllers/AuthController.java auth/internal/presentation/controllers/
mv presentation/controllers/AccessController.java auth/internal/presentation/controllers/

# Update package declarations
sed -i 's/package com.intelliquiz.api.presentation.controllers/package com.intelliquiz.api.auth.internal.presentation.controllers/' auth/internal/presentation/controllers/*.java

# Change class visibility to package-private
sed -i 's/public class/class/' auth/internal/presentation/controllers/*.java
```

#### Step 2.6: Create Commands & Events (2 hours)
```bash
# Create commands at module root (public)
cat > auth/commands/CreateUserCommand.java << 'EOF'
package com.intelliquiz.api.auth.commands;

import com.intelliquiz.api.shared.enums.SystemRole;

public record CreateUserCommand(
    String username,
    String password,
    SystemRole systemRole
) {}
EOF

# Create events at module root (public)
cat > auth/events/UserAuthenticatedEvent.java << 'EOF'
package com.intelliquiz.api.auth.events;

public record UserAuthenticatedEvent(Long userId) {}
EOF

cat > auth/events/UserCreatedEvent.java << 'EOF'
package com.intelliquiz.api.auth.events;

public record UserCreatedEvent(Long userId) {}
EOF
```

#### Step 2.7: Create package-info.java Files (1 hour)
```bash
# Module root
cat > auth/package-info.java << 'EOF'
@ApplicationModule(
    displayName = "Authentication & Authorization",
    allowedDependencies = "shared"
)
package com.intelliquiz.api.auth;

import org.springframework.modulith.ApplicationModule;
EOF

# Internal package
cat > auth/internal/package-info.java << 'EOF'
@org.springframework.lang.NonNullApi
package com.intelliquiz.api.auth.internal;
EOF

# Create package-info.java for all subpackages
for dir in auth/internal/application/{usecases,services} auth/internal/domain/services auth/internal/infrastructure/{persistence,config,adapters} auth/internal/presentation/{controllers,dto}; do
    cat > $dir/package-info.java << 'EOF'
@org.springframework.lang.NonNullApi
package com.intelliquiz.api.auth.internal.$(basename $dir);
EOF
done
```

#### Step 2.8: Test Auth Module (2 hours)
```bash
./mvnw clean compile
./mvnw test -Dtest=*Auth*
```

---

### Phase 3-9: Repeat for Other Modules (Weeks 2-6)

Follow the same pattern for each module:
1. Move domain entities to module root (public)
2. Create service interfaces at module root (public)
3. Create repository interfaces at module root (public)
4. Move service implementations to `internal/application/services`
5. Move domain services to `internal/domain/services`
6. Move JPA repositories to `internal/infrastructure/persistence`
7. Move controllers to `internal/presentation/controllers`
8. Create commands and events at module root (public)
9. Create all package-info.java files
10. Test module

**Time Estimates**:
- Quiz: 8 hours (Week 2-3)
- Team: 4 hours (Week 3)
- Submission: 5 hours (Week 3-4)
- Scoreboard: 6 hours (Week 4)
- User: 4 hours (Week 4)
- Backup: 5 hours (Week 5)
- Realtime: 10 hours (Week 5-6)

---

### Phase 10: Cleanup & Testing (Week 6)

#### Step 10.1: Delete Old Structure (1 hour)
```bash
# Delete old directories
rm -rf application/
rm -rf domain/
rm -rf infrastructure/
rm -rf presentation/

# Verify no broken imports
./mvnw clean compile
```

#### Step 10.2: Run All Tests (2 hours)
```bash
./mvnw clean test
```

#### Step 10.3: Verify Module Boundaries (2 hours)
```bash
./mvnw test -Dtest=ModuleStructureTest
```

#### Step 10.4: Generate Module Documentation (1 hour)
```bash
./mvnw spring-modulith:create-documentation
```

---


## Testing Strategy

### Module Structure Tests

```java
// src/test/java/com/intelliquiz/api/ModuleStructureTest.java
package com.intelliquiz.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

@SpringBootTest
class ModuleStructureTest {
    
    ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
    
    @Test
    void verifyModuleStructure() {
        // Fails if any module violates boundaries
        modules.verify();
    }
    
    @Test
    void shouldNotAccessInternalPackages() {
        modules.forEach(module -> {
            System.out.println("Module: " + module.getName());
            System.out.println("  Base Package: " + module.getBasePackage());
            System.out.println("  Dependencies: " + module.getDependencies());
            
            // Verify no dependencies on internal packages
            module.getDependencies().forEach(dep -> {
                assertThat(dep.getTarget().getName())
                    .doesNotContain(".internal");
            });
        });
    }
    
    @Test
    void documentModules() {
        new Documenter(modules)
            .writeModulesAsPlantUml()
            .writeIndividualModulesAsPlantUml();
    }
    
    @Test
    void verifyCleanArchitectureLayering() {
        // Verify internal packages follow Clean Architecture
        modules.forEach(module -> {
            // Application layer should not depend on presentation
            // Domain layer should not depend on infrastructure or presentation
            // Infrastructure can depend on domain
            // Presentation can depend on application
        });
    }
}
```

### Integration Tests Per Module

```java
// src/test/java/com/intelliquiz/api/auth/AuthModuleIntegrationTest.java
@SpringBootTest
@Transactional
class AuthModuleIntegrationTest {
    
    @Autowired
    private AuthenticationService authService;  // Public interface
    
    @Autowired
    private UserRepository userRepository;      // Public interface
    
    @Test
    void shouldAuthenticateUser() {
        // Given
        User user = new User("testuser", "hashedpass", SystemRole.ADMIN);
        userRepository.save(user);
        
        // When
        AuthenticationResult result = authService.authenticate("testuser", "password");
        
        // Then
        assertThat(result.isSuccess()).isTrue();
    }
    
    @Test
    void shouldNotAccessInternalClasses() {
        // This should not compile if module boundaries are enforced
        // AuthenticationServiceImpl impl = new AuthenticationServiceImpl();  // ❌ Cannot access
    }
}
```

### Event Publication Tests

```java
// src/test/java/com/intelliquiz/api/EventPublicationTest.java
@SpringBootTest
class EventPublicationTest {
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    @Autowired
    private ScoreboardProjection scoreboardProjection;
    
    @Test
    void shouldPublishSubmissionEvent() {
        // Given
        SubmissionReceivedEvent event = new SubmissionReceivedEvent(1L, 1L, 1L, true, 10);
        
        // When
        eventPublisher.publishEvent(event);
        
        // Then
        // Verify scoreboard was updated
        await().atMost(2, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                ScoreboardReadModel score = scoreboardQueryService.getTeamScore(1L);
                assertThat(score.getTotalScore()).isEqualTo(10);
            });
    }
}
```

### Clean Architecture Layer Tests

```java
// src/test/java/com/intelliquiz/api/ArchitectureTest.java
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {
    
    private final JavaClasses classes = new ClassFileImporter()
        .importPackages("com.intelliquiz.api");
    
    @Test
    void domainLayerShouldNotDependOnInfrastructure() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..internal.domain..")
            .should().dependOnClassesThat()
            .resideInAPackage("..internal.infrastructure..");
        
        rule.check(classes);
    }
    
    @Test
    void domainLayerShouldNotDependOnPresentation() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..internal.domain..")
            .should().dependOnClassesThat()
            .resideInAPackage("..internal.presentation..");
        
        rule.check(classes);
    }
    
    @Test
    void applicationLayerShouldNotDependOnPresentation() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..internal.application..")
            .should().dependOnClassesThat()
            .resideInAPackage("..internal.presentation..");
        
        rule.check(classes);
    }
    
    @Test
    void presentationLayerCanDependOnApplication() {
        // This is allowed - controllers can use services
    }
    
    @Test
    void infrastructureCanDependOnDomain() {
        // This is allowed - repositories implement domain interfaces
    }
}
```

---

## File Count & Estimates

### Complete File Count by Module

| Module | Public API | Internal Layers | Total |
|--------|-----------|-----------------|-------|
| | Entities, Interfaces, Commands, Events | application, domain, infrastructure, presentation | |
| **Shared** | 15 | 0 | **15** |
| **Auth** | 11 | 24 | **35** |
| **User** | 6 | 9 | **15** |
| **Quiz** | 12 | 18 | **30** |
| **Team** | 5 | 13 | **18** |
| **Submission** | 5 | 15 | **20** |
| **Scoreboard** | 4 | 12 | **16** |
| **Backup** | 6 | 16 | **22** |
| **Realtime** | 6 | 22 | **28** |
| **TOTAL** | **70** | **129** | **199** |

### Detailed Breakdown by Layer

| Module | Entities | Interfaces | Commands | Events | Application | Domain | Infrastructure | Presentation |
|--------|----------|-----------|----------|--------|-------------|--------|----------------|--------------|
| Shared | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Auth | 2 | 4 | 2 | 3 | 8 | 2 | 8 | 6 |
| User | 0 | 1 | 2 | 3 | 4 | 0 | 0 | 5 |
| Quiz | 2 | 4 | 4 | 4 | 6 | 2 | 4 | 6 |
| Team | 1 | 2 | 0 | 2 | 4 | 2 | 2 | 5 |
| Submission | 1 | 2 | 0 | 2 | 4 | 3 | 2 | 6 |
| Scoreboard | 1 | 2 | 0 | 0 | 5 | 0 | 2 | 5 |
| Backup | 1 | 2 | 0 | 2 | 4 | 2 | 6 | 4 |
| Realtime | 1 | 4 | 0 | 0 | 8 | 3 | 5 | 6 |

### Time Estimates

| Phase | Module | Hours | Week |
|-------|--------|-------|------|
| 1 | Shared | 7 | Week 1 |
| 2 | Auth | 14 | Week 1-2 |
| 3 | Quiz | 10 | Week 2-3 |
| 4 | Team | 5 | Week 3 |
| 5 | Submission | 6 | Week 3-4 |
| 6 | Scoreboard | 7 | Week 4 |
| 7 | User | 5 | Week 4 |
| 8 | Backup | 6 | Week 5 |
| 9 | Realtime | 12 | Week 5-6 |
| 10 | Cleanup & Testing | 6 | Week 6 |
| **TOTAL** | | **78 hours** | **6 weeks** |

### Comparison with Other Approaches

| Approach | Files | Layers | Effort | Complexity | Maintainability |
|----------|-------|--------|--------|------------|-----------------|
| **Current (no modules)** | 95 | 4 | 0 hours | Low | Low |
| **Simple modules (no Clean Arch)** | 116 | 2 | 64 hours | Medium | Medium |
| **This approach (modules + Clean Arch)** | **199** | **5** | **78 hours** | **High** | **Very High** |
| **Full Clean Architecture** | 250+ | 6+ | 120 hours | Very High | High |

---

## Key Takeaways

### What Makes This Approach Unique?

1. **Module boundaries at top level**: Spring Modulith enforces module isolation
2. **Clean Architecture inside modules**: Full layering within each module's `internal/` package
3. **Simple public API**: Other modules only see entities, interfaces, commands, events
4. **Hidden implementation**: All use cases, adapters, controllers hidden in `internal/`
5. **Best of both worlds**: Module boundaries + Clean Architecture layers

### Benefits

✅ **Strong module boundaries**: Spring Modulith compile-time verification
✅ **Clean Architecture**: Proper separation of concerns within modules
✅ **Testability**: Can test layers independently
✅ **Flexibility**: Each module can choose its internal structure
✅ **Scalability**: Can extract modules to microservices later
✅ **Maintainability**: Clear responsibilities at both module and layer levels

### Public API (What Other Modules See)

```java
// Other modules can import:
import com.intelliquiz.api.auth.User;                    // ✅ Entity
import com.intelliquiz.api.auth.AuthenticationService;   // ✅ Service interface
import com.intelliquiz.api.auth.UserRepository;          // ✅ Repository interface
import com.intelliquiz.api.auth.commands.*;              // ✅ Commands
import com.intelliquiz.api.auth.events.*;                // ✅ Events

// Other modules CANNOT import:
import com.intelliquiz.api.auth.internal.*;              // ❌ Blocked by Spring Modulith
import com.intelliquiz.api.auth.internal.application.*;  // ❌ Hidden
import com.intelliquiz.api.auth.internal.infrastructure.*;// ❌ Hidden
import com.intelliquiz.api.auth.internal.presentation.*; // ❌ Hidden
```

### Clean Architecture Layers (Inside internal/)

```
internal/
├── application/        # Use cases, application services
│   ├── usecases/      # One use case per operation
│   └── services/      # Service implementations
├── domain/            # Business logic
│   └── services/      # Domain services
├── infrastructure/    # External concerns
│   ├── persistence/   # JPA repositories
│   ├── config/        # Configuration
│   └── adapters/      # External adapters
└── presentation/      # Controllers, DTOs
    ├── controllers/   # REST controllers
    └── dto/           # Request/Response DTOs
```

### Dependency Rules

**Between Modules** (enforced by Spring Modulith):
- Modules can only access public API of other modules
- Cannot access `internal/` packages of other modules

**Within Modules** (enforced by ArchUnit):
- Domain → No dependencies on other layers
- Application → Can depend on Domain
- Infrastructure → Can depend on Domain
- Presentation → Can depend on Application

---

## Next Steps

1. ✅ Review this guide
2. ✅ Start with Shared module (7 hours)
3. ✅ Implement Auth module (14 hours)
4. ✅ Test after each module
5. ✅ Verify with Spring Modulith
6. ✅ Add ArchUnit tests for Clean Architecture
7. ✅ Document as you go

**This approach gives you maximum architectural benefits with clear boundaries at both module and layer levels!**

---

## Appendix: Module Dependency Graph

```
┌─────────┐
│ Shared  │ (Foundation - no dependencies)
└────┬────┘
     │
     ├──────────────────────────────────────┐
     │                                      │
┌────▼────┐                           ┌────▼────┐
│  Auth   │                           │  Quiz   │
└────┬────┘                           └────┬────┘
     │                                      │
     ├──────────┬──────────┬────────────────┤
     │          │          │                │
┌────▼────┐ ┌──▼──────┐ ┌─▼──────┐    ┌───▼────────┐
│  User   │ │  Team   │ │ Backup │    │ Submission │
└─────────┘ └────┬────┘ └────────┘    └─────┬──────┘
                 │                            │
                 └──────────┬─────────────────┤
                            │                 │
                       ┌────▼──────┐    ┌─────▼─────┐
                       │ Scoreboard│    │ Realtime  │
                       └───────────┘    └───────────┘
```

---

## Questions?

If you have questions about:
- **Module boundaries**: Check `package-info.java` examples
- **Clean Architecture layers**: See internal/ structure
- **Public vs Internal**: Everything at root is public, everything in internal/ is hidden
- **Service design**: Interfaces at root, implementations in internal/application/services
- **Event communication**: Use Spring's `ApplicationEventPublisher`
- **Testing**: See Testing Strategy section
- **Migration**: Follow Phase-by-phase migration steps

**Remember**: This approach combines Spring Modulith module boundaries with Clean Architecture layers inside each module!

