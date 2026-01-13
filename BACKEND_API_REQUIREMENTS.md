# Backend API Requirements for Frontend

## Missing Endpoints

### 1. GET `/api/users` - List All Users
**Status:** MISSING - Causes 500 error on Users page and Dashboard

**Required Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  },
  {
    "id": 2,
    "username": "superadmin",
    "role": "SUPER_ADMIN"
  }
]
```

**Implementation needed:**
- Add `List<User> findAll()` to `UserRepository` interface
- Add `findAll()` implementation to `UserRepositoryImpl`
- Add `getAllAdmins()` method to `UserManagementService`
- Add `@GetMapping` endpoint to `UserController`

---

## Current API Issues

### 2. UserResponse Missing `createdAt` Field
The frontend expects `createdAt` but `UserResponse` doesn't include it.

**Option A:** Add `createdAt` to User entity and UserResponse
**Option B:** Frontend will be updated to not require this field (DONE)

---

## Permission Values Reference
The frontend uses these permission keys (matching `AdminPermission` enum):
- `CAN_VIEW_DETAILS`
- `CAN_EDIT_CONTENT`
- `CAN_MANAGE_TEAMS`
- `CAN_HOST_GAME`

---

## API Endpoints Summary (from Swagger screenshot)

### Users (SUPER_ADMIN only)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/users` | List all users | **MISSING** |
| POST | `/api/users` | Create admin user | ✅ |
| PUT | `/api/users/{id}` | Update user | ✅ |
| DELETE | `/api/users/{id}` | Delete user | ✅ |
| POST | `/api/users/{userId}/permissions` | Assign quiz permissions | ✅ |
| DELETE | `/api/users/{userId}/permissions/{quizId}` | Revoke quiz access | ✅ |

### Quizzes
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/quizzes` | List all quizzes | ✅ |
| GET | `/api/quizzes/{id}` | Get quiz by ID | ✅ |
| GET | `/api/quizzes/active` | Get active session | ✅ |
| POST | `/api/quizzes` | Create quiz | ✅ |
| PUT | `/api/quizzes/{id}` | Update quiz | ✅ |
| DELETE | `/api/quizzes/{id}` | Delete quiz | ✅ |
| POST | `/api/quizzes/{id}/ready` | Mark as ready | ✅ |
| POST | `/api/quizzes/{id}/activate` | Activate session | ✅ |
| POST | `/api/quizzes/{id}/deactivate` | Deactivate session | ✅ |
| POST | `/api/quizzes/{id}/archive` | Archive quiz | ✅ |
