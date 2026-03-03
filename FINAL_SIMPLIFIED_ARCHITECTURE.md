# Final Simplified Architecture - IntelliQuiz

## The Simplest Approach That Works

### Structure Per Module

```
<module>/
├── package-info.java                   # @ApplicationModule
├── <Entity>.java                       # Domain entities (WITH @Entity)
├── <Service>.java                      # Services (all operations)
├── <Repository>.java                   # Port interfaces
├── commands/                           # Command DTOs
│   └── <Command>.java
├── events/                             # Domain events
│   └── <Event>.java
└── internal/                           # Hidden from other modules
    ├── Jpa<Entity>Repository.java     # Spring Data JPA
    ├── <Controller>.java               # REST controllers
    └── <Config>.java                   # Configuration
```

**That's it!** No api/ folder, no facades, no use cases, no mappers.

---

## Example: Auth Module

```
auth/
├── package-info.java
├── User.java                           # Domain entity (WITH @Entity)
├── QuizAssignment.java                 # Domain entity (WITH @Entity)
├── AuthenticationService.java          # Service (public)
├── AuthorizationService.java           # Service (public)
├── UserRepository.java                 # Port interface (public)
├── QuizAssignmentRepository.java       # Port interface (public)
├── commands/
│   ├── CreateUserCommand.java
│   └── UpdateUserCommand.java
├── events/
│   ├── UserAuthenticatedEvent.java
│   └── UserCreatedEvent.java
└── internal/
    ├── JpaUserRepository.java          # Spring Data JPA
    ├── JpaQuizAssignmentRepository.java
    ├── BCryptPasswordHashingService.java
    ├── AuthController.java             # REST controller
    ├── AccessController.java
    ├── JwtConfig.java
    ├── JwtAuthenticationFilter.java
    └── SecurityConfig.java
```

**Code Examples**:

```java
// User.java - Domain entity (WITH @Entity)
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

// UserRepository.java - Port interface (public)
public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAll();
}

// AuthenticationService.java - Service (public)
@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordHashingService passwordHashingService;
    
    public AuthenticationResult authenticate(String username, String password) {
        return userRepository.findByUsername(username)
            .map(user -> verifyPassword(user, password))
            .orElse(AuthenticationResult.failure("Invalid credentials"));
    }
    
    private AuthenticationResult verifyPassword(User user, String password) {
        if (passwordHashingService.matches(password, user.getPassword())) {
            return AuthenticationResult.success(user);
        }
        return AuthenticationResult.failure("Invalid credentials");
    }
}

// internal/JpaUserRepository.java - Adapter (hidden)
@Repository
interface JpaUserRepository extends UserRepository, JpaRepository<User, Long> {
    // Spring Data JPA provides implementation automatically
}

// internal/AuthController.java - REST controller (hidden)
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

// package-info.java - Module definition
@ApplicationModule(
    displayName = "Authentication & Authorization",
    allowedDependencies = "shared"
)
package com.intelliquiz.api.auth;
```

---

## How Other Modules Use Auth

```java
// In Quiz module
@Service
public class QuizService {
    private final QuizRepository quizRepository;
    private final AuthorizationService authzService;  // Direct access!
    
    public Quiz createQuiz(CreateQuizCommand cmd, User user) {
        // Use auth service directly (no facade needed)
        authzService.checkPermission(user, null, AdminPermission.CREATE);
        
        Quiz quiz = new Quiz(cmd.title(), cmd.description());
        return quizRepository.save(quiz);
    }
}
```

**Spring Modulith allows**:
```java
import com.intelliquiz.api.auth.User;                    // ✅ Public
import com.intelliquiz.api.auth.AuthenticationService;   // ✅ Public
import com.intelliquiz.api.auth.AuthorizationService;    // ✅ Public
import com.intelliquiz.api.auth.UserRepository;          // ✅ Public
import com.intelliquiz.api.auth.events.*;                // ✅ Public
```

**Spring Modulith blocks**:
```java
import com.intelliquiz.api.auth.internal.*;              // ❌ Hidden
import com.intelliquiz.api.auth.internal.AuthController; // ❌ Hidden
import com.intelliquiz.api.auth.internal.JwtConfig;      // ❌ Hidden
```

---

## All 9 Modules

### 1. Shared
```
shared/
├── exceptions/
├── enums/
├── valueobjects/
└── services/
```

### 2. Auth
```
auth/
├── User.java
├── QuizAssignment.java
├── AuthenticationService.java
├── AuthorizationService.java
├── UserRepository.java
├── events/
└── internal/
```

### 3. User
```
user/
├── UserManagementService.java
├── commands/
├── events/
└── internal/
```

### 4. Quiz
```
quiz/
├── Quiz.java
├── Question.java
├── QuizService.java
├── QuestionService.java
├── QuizRepository.java
├── QuestionRepository.java
├── commands/
├── events/
└── internal/
```

### 5. Team
```
team/
├── Team.java
├── TeamService.java
├── TeamRepository.java
├── events/
└── internal/
```

### 6. Submission
```
submission/
├── Submission.java
├── SubmissionService.java
├── SubmissionRepository.java
├── events/
└── internal/
```

### 7. Scoreboard (CQRS)
```
scoreboard/
├── ScoreboardReadModel.java
├── ScoreboardQueryService.java
├── ScoreboardProjection.java
├── ScoreboardReadRepository.java
└── internal/
```

### 8. Backup
```
backup/
├── BackupRecord.java
├── BackupService.java
├── BackupRepository.java
├── events/
└── internal/
```

### 9. Realtime
```
realtime/
├── GameState.java
├── BroadcastService.java
├── GameFlowService.java
├── TimerService.java
├── SessionManager.java
└── internal/
    ├── WebSocketConfig.java
    ├── WebSocketController.java
    └── dto/
```

---

## Migration Steps

### Step 1: Create Shared Module (2 hours)
```bash
mkdir -p src/main/java/com/intelliquiz/api/shared/{exceptions,enums,valueobjects,services}

# Move files
mv domain/exceptions/* shared/exceptions/
mv domain/enums/* shared/enums/
mv domain/services/CodeGenerationService.java shared/services/

# Create package-info.java
```

### Step 2: Create Auth Module (4 hours)
```bash
mkdir -p src/main/java/com/intelliquiz/api/auth/{commands,events,internal}

# Move domain entities (keep @Entity!)
mv domain/entities/User.java auth/
mv domain/entities/QuizAssignment.java auth/

# Move services
mv application/services/Authentication*.java auth/
mv application/services/Authorization*.java auth/

# Move to internal/
mv infrastructure/config/Security*.java auth/internal/
mv infrastructure/config/Jwt*.java auth/internal/
mv presentation/controllers/AuthController.java auth/internal/

# Create repository interfaces
# Create package-info.java
```

### Step 3: Create Other Modules (40 hours)
Repeat for quiz, team, submission, scoreboard, user, backup, realtime

### Step 4: Cleanup (2 hours)
```bash
# Delete old structure
rm -rf application/
rm -rf domain/
rm -rf infrastructure/
rm -rf presentation/

# Run tests
./mvnw test

# Verify modules
./mvnw test -Dtest=ModuleStructureTest
```

---

## Testing

```java
// ModuleStructureTest.java
@SpringBootTest
class ModuleStructureTest {
    
    @Test
    void verifyModuleStructure() {
        ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
        modules.verify();  // Fails if boundaries violated
    }
    
    @Test
    void shouldNotAccessInternalPackages() {
        ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);
        
        // Verify auth.internal is not accessible
        modules.getModuleByName("quiz")
            .ifPresent(quizModule -> {
                assertThat(quizModule.getDependencies())
                    .noneMatch(dep -> dep.getTarget().getName().contains("auth.internal"));
            });
    }
}
```

---

## Key Takeaways

1. **No api/ folder** - Use `internal/` instead (simpler)
2. **No facades** - Direct service access (less indirection)
3. **No use cases** - Services with multiple methods (less classes)
4. **No mappers** - Domain entities WITH @Entity (no mapping)
5. **No separate JPA entities** - One entity class (pragmatic)

**Result**: 70% less code than Clean Architecture, same benefits!

---

## File Count Comparison

| Module | Clean Arch | With api/ | **Simplified** |
|--------|-----------|-----------|----------------|
| Auth | 25 files | 18 files | **12 files** |
| Quiz | 35 files | 22 files | **15 files** |
| Team | 15 files | 9 files | **6 files** |
| **Total** | **135 files** | **98 files** | **65 files** |

**Simplified approach**: 50% fewer files than Clean Architecture!

---

## Next Steps

1. ✅ Review this simplified structure
2. ✅ Start with Shared module
3. ✅ Create Auth module
4. ✅ Test after each module
5. ✅ Verify with Spring Modulith

**This is the simplest architecture that gives you all the benefits with minimal complexity!**
