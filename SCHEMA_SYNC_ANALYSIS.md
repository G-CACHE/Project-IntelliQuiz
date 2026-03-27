# API Schema Synchronization Analysis

## Executive Summary

Major inconsistencies exist between **backend API responses** and **frontend type definitions**, causing runtime errors and `undefined` values when the frontend receives quiz data.

**Critical Impact:** The frontend expects `navigationMode` and `globalTimeLimitSeconds` in all quiz objects, but the backend `QuizResponse` DTO does not include these fields, even though they exist in the `Quiz` entity and are essential for game logic.

---

## Detailed Findings

### 1. QuizResponse DTO Missing Fields (CRITICAL)

**Issue:** The backend `QuizResponse` record is not serializing fields that exist in the `Quiz` entity.

#### Backend Quiz Entity (Has these fields)
- `navigationMode: NavigationMode` (default: `LINEAR`)
- `globalTimeLimitSeconds: int` (default: `0`)
- `isLiveSession: boolean`

#### Backend QuizResponse DTO (Missing above)
```java
public record QuizResponse(
    Long id,
    String title,
    String description,
    String quizCode,
    String proctorPin,
    boolean isLiveSession,      // ✓ Present
    QuizStatus status,
    Long createdByUserId,
    QuizAccessMode accessMode,
    int questionCount,
    int teamCount
    // ✗ MISSING: navigationMode
    // ✗ MISSING: globalTimeLimitSeconds
)
```

#### Frontend Quiz Interface (Expects these)
```typescript
export interface Quiz {
  id: number;
  title: string;
  description: string;
  quizCode?: string;
  proctorPin: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  questionCount?: number;
  navigationMode?: NavigationMode;      // ✗ UNDEFINED (backend doesn't send)
  globalTimeLimitSeconds?: number;      // ✗ UNDEFINED (backend doesn't send)
  createdByUserId?: number;
  // ✗ MISSING: isLiveSession (backend sends but frontend doesn't expect)
}
```

**Impact:**
- Frontend code accessing `quiz.navigationMode` gets `undefined`
- Frontend code accessing `quiz.globalTimeLimitSeconds` gets `undefined`
- Game flow logic that depends on these values breaks silently

---

### 2. CreateQuizRequest Missing Configuration Fields

**Issue:** Quiz creation requests cannot set `navigationMode` or `globalTimeLimitSeconds`.

#### Backend CreateQuizRequest
```java
public record CreateQuizRequest(
    String title,                    // Required
    String description,              // Optional
    QuizAccessMode accessMode        // Optional
    // ✗ MISSING: navigationMode
    // ✗ MISSING: globalTimeLimitSeconds
)
```

#### Frontend CreateQuizRequest
```typescript
export interface CreateQuizRequest {
  title: string;
  description?: string;
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  // ✗ MISSING: navigationMode
  // ✗ MISSING: globalTimeLimitSeconds
}
```

**Impact:**
- Admins cannot set quiz navigation mode on creation
- Cannot pre-configure global time limits
- Must rely on defaults (LINEAR, 0) or use separate update calls

---

### 3. UpdateQuizRequest Missing Configuration Fields

**Issue:** Quiz updates cannot modify `navigationMode` or `globalTimeLimitSeconds`.

#### Backend UpdateQuizRequest
```java
public record UpdateQuizRequest(
    String title,
    String description,
    QuizAccessMode accessMode
    // ✗ MISSING: navigationMode
    // ✗ MISSING: globalTimeLimitSeconds
)
```

**Impact:**
- No way to update these critical fields via the REST API
- Forcing runtime changes through SessionManager (fragile pattern)
- Cannot modify navigation mode after quiz creation

---

### 4. Missing isLiveSession in Frontend

**Issue:** Backend sends `isLiveSession` but frontend doesn't capture it.

#### Backend QuizResponse
- Returns `isLiveSession: boolean` ✓

#### Frontend Quiz Interface
- Does NOT include `isLiveSession` ✗

**Impact:**
- Frontend cannot determine if a quiz has an active live session
- UI cannot properly display live status indicators

---

## Affected Code Paths

### Backend (GameFlowService)
These services depend on `navigationMode` and `globalTimeLimitSeconds`:
- `GameFlowService.startLinearQuiz()` - Checks `navigationMode == LINEAR`
- `GameFlowService.startNonLinearQuiz(Long quizId, int globalTimeLimitSeconds)` - Uses both fields
- `GameFlowService.submitAnswer()` - Checks navigation mode
- `GameFlowService.navigateToQuestion()` - Checks if NON_LINEAR

### Frontend (Potential Problem Areas)
While not currently visible in the grep results, any code that consumes `quiz.navigationMode` or `quiz.globalTimeLimitSeconds` will receive `undefined`:
- Quiz configuration pages
- Admin quiz setup flows
- Game initialization logic
- Quiz display/UI rendering

---

## Recommended Fixes

### Priority 1: Fix QuizResponse DTO (CRITICAL)
Update `QuizResponse.java` to include missing fields:
```java
public record QuizResponse(
    Long id,
    String title,
    String description,
    String quizCode,
    String proctorPin,
    boolean isLiveSession,
    QuizStatus status,
    Long createdByUserId,
    QuizAccessMode accessMode,
    int questionCount,
    int teamCount,
    NavigationMode navigationMode,          // ← ADD
    int globalTimeLimitSeconds              // ← ADD
)
```

And update `QuizResponse.from()` method:
```java
public static QuizResponse from(Quiz quiz) {
    return new QuizResponse(
        // ... existing fields ...
        quiz.getNavigationMode(),           // ← ADD
        quiz.getGlobalTimeLimitSeconds()    // ← ADD
    );
}
```

### Priority 2: Extend CreateQuizRequest DTO
Add fields to allow configuration on creation:
```java
public record CreateQuizRequest(
    String title,
    String description,
    QuizAccessMode accessMode,
    NavigationMode navigationMode,          // ← ADD (optional, default LINEAR)
    int globalTimeLimitSeconds              // ← ADD (optional, default 0)
)
```

### Priority 3: Extend UpdateQuizRequest DTO
Add fields to allow updates:
```java
public record UpdateQuizRequest(
    String title,
    String description,
    QuizAccessMode accessMode,
    NavigationMode navigationMode,          // ← ADD (optional)
    int globalTimeLimitSeconds              // ← ADD (optional)
)
```

### Priority 4: Update Frontend Quiz Interface
```typescript
export interface Quiz {
  id: number;
  title: string;
  description: string;
  quizCode?: string;
  proctorPin: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  questionCount?: number;
  navigationMode?: NavigationMode;        // ← Already present but receiving undefined
  globalTimeLimitSeconds?: number;        // ← Already present but receiving undefined
  createdByUserId?: number;
  isLiveSession?: boolean;                // ← ADD (backend sends this)
}
```

### Priority 5: Extend Frontend CreateQuizRequest
```typescript
export interface CreateQuizRequest {
  title: string;
  description?: string;
  accessMode?: 'PUBLIC' | 'RESTRICTED';
  navigationMode?: NavigationMode;        // ← ADD
  globalTimeLimitSeconds?: number;        // ← ADD
}
```

---

## Testing Impact

After fixes, verify:
1. ✓ `GET /api/quiz/{id}` returns `navigationMode` and `globalTimeLimitSeconds`
2. ✓ `POST /api/quiz/create` accepts optional `navigationMode` and `globalTimeLimitSeconds`
3. ✓ `PUT /api/quiz/{id}` allows updating these fields
4. ✓ Frontend stores and uses these fields correctly
5. ✓ Game flow logic properly branches on `navigationMode`

---

## Files Affected

### Backend (Backend First - These are Source of Truth)
- `backend/src/main/java/.../quiz/.../dto/response/QuizResponse.java` - **CRITICAL**
- `backend/src/main/java/.../quiz/.../dto/request/CreateQuizRequest.java`
- `backend/src/main/java/.../quiz/.../dto/request/UpdateQuizRequest.java`

### Frontend (Update After Backend)
- `frontend/intelliquiz-frontend/src/services/api.ts`

### Related Services (No changes likely needed)
- `backend/src/main/java/.../quiz/.../domain/entities/Quiz.java` (Already has fields)
- `backend/src/main/java/.../realm/services/GameFlowService.java` (Already uses these fields)

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| `undefined` errors in frontend | HIGH | Fix QuizResponse DTO first |
| Game flow logic breaks silently | HIGH | Provide global time limit in response |
| Admin UX unclear (can't set nav mode) | MEDIUM | Extend create/update requests |
| Inconsistent type definitions | MEDIUM | Update frontend interfaces after backend |
| Breaking API change | LOW | These are new additions, not changes to existing fields |

---

## Implementation Order

1. Update `QuizResponse` to include `navigationMode` and `globalTimeLimitSeconds`
2. Update `CreateQuizRequest` to accept optional `navigationMode` and `globalTimeLimitSeconds`
3. Update `UpdateQuizRequest` similarly
4. Update frontend `Quiz` interface to match + add `isLiveSession`
5. Update frontend `CreateQuizRequest` interface
6. Test end-to-end quiz creation and retrieval
