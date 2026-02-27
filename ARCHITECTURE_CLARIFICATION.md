# Architecture Clarification - What's REALLY Different?

## Your Questions Answered

### Q1: "It still has application, presentation, domain, infrastructure - what's the difference?"

**You're RIGHT to be confused!** The layer names are similar, but the KEY differences are:

### Clean Architecture (Complex)
```
quiz/
├── domain/
│   ├── entities/
│   │   └── Quiz.java                    # Pure POJO (NO @Entity)
│   └── usecases/
│       ├── CreateQuizUseCase.java       # One class per operation
│       ├── UpdateQuizUseCase.java       # One class per operation
│       ├── DeleteQuizUseCase.java       # One class per operation
│       └── GetQuizUseCase.java          # One class per operation
├── infrastructure/
│   ├── persistence/
│   │   ├── QuizJpaEntity.java           # Separate JPA entity
│   │   ├── QuizMapper.java              # Maps Domain ↔ JPA
│   │   └── QuizRepositoryAdapter.java   # Implements port
│   └── adapters/
│       └── QuizController.java
```

**Result**: 
- 2 entity classes (Quiz + QuizJpaEntity)
- 1 mapper class
- 4+ use case classes
- Total: 7+ classes for basic CRUD

### Our Pragmatic Approach (Simple)
```
quiz/
├── domain/
│   ├── Quiz.java                        # WITH @Entity (pragmatic!)
│   └── ports/
│       └── QuizRepository.java          # Interface only
├── application/
│   └── QuizService.java                 # All operations in one service
└── infrastructure/
    └── persistence/
        └── JpaQuizRepository.java       # Spring Data JPA
```

**Result**:
- 1 entity class (Quiz with @Entity)
- 0 mapper classes
- 1 service class (all operations)
- Total: 3 classes for basic CRUD

---

## The REAL Differences

| Aspect | Clean Architecture | Our Approach | Impact |
|--------|-------------------|--------------|--------|
| **Domain Entity** | Pure POJO (no @Entity) | WITH @Entity | 50% less code |
| **JPA Entity** | Separate class | Same as domain | No mapping needed |
| **Mapper** | Required | Not needed | 30% less code |
| **Operations** | One use case per operation | One service with methods | 70% less classes |
| **Repository** | Adapter implements port | Spring Data JPA | Automatic implementation |

### Example: Creating a Quiz

**Clean Architecture** (7 files):
```java
// 1. Domain entity (pure POJO)
public class Quiz {
    private QuizId id;
    private String title;
    // No @Entity, no JPA annotations
}

// 2. JPA entity (separate)
@Entity
public class QuizJpaEntity {
    @Id
    @GeneratedValue
    private Long id;
    private String title;
}

// 3. Mapper
public class QuizMapper {
    public Quiz toDomain(QuizJpaEntity jpa) { ... }
    public QuizJpaEntity toJpa(Quiz domain) { ... }
}

// 4. Output port (interface)
public interface QuizOutputPort {
    Quiz save(Quiz quiz);
}

// 5. Repository adapter
public class QuizRepositoryAdapter implements QuizOutputPort {
    private final JpaQuizRepository jpaRepo;
    private final QuizMapper mapper;
    
    public Quiz save(Quiz quiz) {
        QuizJpaEntity jpa = mapper.toJpa(quiz);
        QuizJpaEntity saved = jpaRepo.save(jpa);
        return mapper.toDomain(saved);
    }
}

// 6. Input port (interface)
public interface CreateQuizInputPort {
    QuizResponse execute(CreateQuizRequest request);
}

// 7. Use case
public class CreateQuizUseCase implements CreateQuizInputPort {
    private final QuizOutputPort repository;
    
    public QuizResponse execute(CreateQuizRequest request) {
        Quiz quiz = new Quiz(request.getTitle());
        Quiz saved = repository.save(quiz);
        return QuizResponse.from(saved);
    }
}
```

**Our Pragmatic Approach** (3 files):
```java
// 1. Domain entity (WITH @Entity)
@Entity
public class Quiz {
    @Id
    @GeneratedValue
    private Long id;
    private String title;
    
    // Rich domain behavior
    public void activate() { ... }
}

// 2. Repository interface (port)
public interface QuizRepository {
    Quiz save(Quiz quiz);
    Optional<Quiz> findById(Long id);
}

// 3. Service (all operations)
@Service
public class QuizService {
    private final QuizRepository repository;
    
    public Quiz createQuiz(CreateQuizCommand cmd) {
        Quiz quiz = new Quiz(cmd.title());
        return repository.save(quiz);
    }
    
    public Quiz updateQuiz(Long id, UpdateQuizCommand cmd) { ... }
    public void deleteQuiz(Long id) { ... }
}

// Bonus: Spring Data JPA provides implementation automatically!
@Repository
public interface JpaQuizRepository 
    extends QuizRepository, JpaRepository<Quiz, Long> {
    // No code needed - Spring Data magic!
}
```

---

## Q2: "What is the api folder for? What is AuthFacade for?"

**Great question!** This is for **Spring Modulith module boundaries**.

### The Problem: Module Coupling

Without the `api/` folder:
```java
// ❌ BAD: Other modules can access EVERYTHING
package com.intelliquiz.api.auth;

// Team module can directly access:
import com.intelliquiz.api.auth.domain.User;              // Internal!
import com.intelliquiz.api.auth.application.AuthService;  // Internal!
import com.intelliquiz.api.auth.infrastructure.*;         // Internal!

// This creates tight coupling!
```

### The Solution: Public API Folder

With the `api/` folder:
```java
// ✅ GOOD: Other modules can ONLY access api/ package
package com.intelliquiz.api.auth.api;  // Public API

// Team module can ONLY access:
import com.intelliquiz.api.auth.api.AuthFacade;     // Public!
import com.intelliquiz.api.auth.api.dto.UserDTO;   // Public!
import com.intelliquiz.api.auth.api.events.*;      // Public!

// Cannot access internal packages:
// import com.intelliquiz.api.auth.domain.*;        // ❌ Blocked by Spring Modulith
// import com.intelliquiz.api.auth.application.*;   // ❌ Blocked by Spring Modulith
```

### What is a Facade?

**Facade Pattern**: A single entry point that hides internal complexity

```java
// AuthFacade.java - Public API for Auth module
@Component
public class AuthFacade {
    // Internal services (not exposed)
    private final AuthenticationService authService;
    private final AuthorizationService authzService;
    private final UserRepository userRepository;
    
    // Public methods (exposed to other modules)
    public AuthenticationResult authenticate(String username, String password) {
        return authService.authenticate(username, password);
    }
    
    public boolean hasPermission(Long userId, Long quizId, AdminPermission permission) {
        User user = userRepository.findById(userId).orElseThrow();
        Quiz quiz = quizRepository.findById(quizId).orElseThrow();
        return authzService.checkPermission(user, quiz, permission);
    }
    
    public UserDTO getUser(Long userId) {
        return userRepository.findById(userId)
            .map(UserDTO::from)
            .orElseThrow();
    }
}
```

### How Other Modules Use It

```java
// In Quiz module
@Service
public class QuizService {
    private final AuthFacade authFacade;  // ✅ Use facade, not internal services
    
    public Quiz createQuiz(CreateQuizCommand cmd, Long userId) {
        // Check permission via facade
        if (!authFacade.hasPermission(userId, null, AdminPermission.CREATE)) {
            throw new AuthorizationException();
        }
        
        Quiz quiz = new Quiz(cmd.title());
        return repository.save(quiz);
    }
}
```

### Spring Modulith Enforcement

```java
// package-info.java in auth module
@ApplicationModule(
    displayName = "Authentication",
    allowedDependencies = "shared"
)
package com.intelliquiz.api.auth;

// package-info.java in auth/api (public)
@NamedInterface("api")
package com.intelliquiz.api.auth.api;
```

**Spring Modulith will FAIL the build if**:
- Other modules try to access `auth.domain.*`
- Other modules try to access `auth.application.*`
- Other modules try to access `auth.infrastructure.*`

**Spring Modulith will ALLOW**:
- Other modules accessing `auth.api.*` (public API)

---

## Simplified Structure (Without api/ folder)

**If you don't want the api/ folder**, you can simplify:

```
auth/
├── package-info.java
├── User.java                           # Public (domain entity)
├── AuthenticationService.java          # Public (service)
├── AuthenticationResult.java           # Public (DTO)
├── events/                             # Public (events)
│   └── UserAuthenticatedEvent.java
└── internal/                           # Internal (hidden)
    ├── PasswordHashingService.java
    ├── JwtConfig.java
    └── SecurityConfig.java
```

**Spring Modulith rule**: Only `internal/` package is hidden

```java
// package-info.java
@ApplicationModule(
    displayName = "Authentication",
    allowedDependencies = "shared"
)
package com.intelliquiz.api.auth;
```

**Other modules can access**:
```java
import com.intelliquiz.api.auth.User;                    // ✅ Public
import com.intelliquiz.api.auth.AuthenticationService;   // ✅ Public
import com.intelliquiz.api.auth.events.*;                // ✅ Public

import com.intelliquiz.api.auth.internal.*;              // ❌ Blocked
```

---

## Recommended: Simplified Structure

For IntelliQuiz, I recommend the **simpler structure without api/ folder**:

```
auth/
├── package-info.java                   # @ApplicationModule
├── User.java                           # Domain entity (public)
├── QuizAssignment.java                 # Domain entity (public)
├── AuthenticationService.java          # Service (public)
├── AuthorizationService.java           # Service (public)
├── UserRepository.java                 # Port interface (public)
├── events/                             # Domain events (public)
│   ├── UserAuthenticatedEvent.java
│   └── package-info.java
└── internal/                           # Internal implementation (hidden)
    ├── JpaUserRepository.java
    ├── BCryptPasswordHashingService.java
    ├── JwtConfig.java
    ├── JwtAuthenticationFilter.java
    ├── SecurityConfig.java
    └── package-info.java
```

**Benefits**:
- ✅ Simpler structure (no facade needed)
- ✅ Direct access to services (less indirection)
- ✅ Still enforces boundaries (internal/ is hidden)
- ✅ Easier to understand

**Usage**:
```java
// In Quiz module
@Service
public class QuizService {
    private final AuthorizationService authzService;  // Direct access (no facade)
    
    public Quiz createQuiz(CreateQuizCommand cmd, User user) {
        authzService.checkPermission(user, null, AdminPermission.CREATE);
        
        Quiz quiz = new Quiz(cmd.title());
        return repository.save(quiz);
    }
}
```

---

## Final Recommendation

### Use This Structure:

```
<module>/
├── package-info.java                   # @ApplicationModule
├── <Entity>.java                       # Domain entities (WITH @Entity, public)
├── <Service>.java                      # Services (public)
├── <Repository>.java                   # Port interfaces (public)
├── commands/                           # Commands (public)
│   └── <Command>.java
├── events/                             # Domain events (public)
│   └── <Event>.java
└── internal/                           # Internal implementation (hidden)
    ├── Jpa<Entity>Repository.java     # JPA adapters
    ├── <Config>.java                   # Configuration
    └── package-info.java
```

**Key Points**:
1. ✅ Domain entities WITH @Entity (no separate JPA entities)
2. ✅ Services with multiple methods (no use case explosion)
3. ✅ Repository interfaces as ports (hexagonal)
4. ✅ `internal/` package for implementation details
5. ✅ No `api/` folder or facades (simpler)
6. ✅ Spring Modulith enforces boundaries

---

## Comparison Summary

| Aspect | Clean Arch | With api/ | **Simplified** |
|--------|-----------|-----------|----------------|
| **Folders** | 6+ layers | 5 layers | **3 layers** |
| **Entity Classes** | 2 (domain + JPA) | 1 | **1** |
| **Mapper** | Required | Not needed | **Not needed** |
| **Use Cases** | 20+ classes | 0 | **0** |
| **Facade** | Not needed | Required | **Not needed** |
| **Complexity** | High | Medium | **Low** |
| **Boilerplate** | 3x code | 1.5x code | **1x code** |
| **Boundaries** | Manual | Enforced | **Enforced** |

---

## Bottom Line

**The REAL difference** from Clean Architecture:
1. Domain entities WITH @Entity (no mapping)
2. Services instead of use cases (less classes)
3. Spring Data JPA (automatic implementation)
4. Simpler structure (3 layers, not 6+)

**The api/ folder**:
- Optional (use `internal/` instead for simplicity)
- Only needed if you want explicit facades
- For IntelliQuiz, `internal/` is simpler and sufficient

**Recommendation**: Use the simplified structure with `internal/` folder!
