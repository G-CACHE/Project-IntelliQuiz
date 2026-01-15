# Admin & Super Admin Pages - Backend Analysis

## System Roles & Permissions

### **System Roles (2-tier hierarchy)**
1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - Restricted access (requires quiz-specific permissions)

### **Admin Permissions (Quiz-level)**
- `CAN_VIEW_DETAILS` - Read-only access to quiz configuration
- `CAN_EDIT_CONTENT` - Create/update/delete questions
- `CAN_MANAGE_TEAMS` - Register teams, generate access codes
- `CAN_HOST_GAME` - Access live session controls and proctor PIN

---

## SUPER_ADMIN Pages & Features

### 1. **User Management Dashboard**
**Endpoint:** `POST/PUT/DELETE /api/users` + `POST/DELETE /api/users/{userId}/permissions`

**Features:**
- Create new admin users
- Edit admin user details (username, password)
- Delete admin users and associated quiz assignments
- Assign quiz permissions to admins
- Revoke quiz access from admins
- View list of all admins

**Components Needed:**
- UserList/UserTable - Display all admins with actions
- UserForm - Create/Edit admin users
- PermissionAssignmentModal - Assign permissions to users per quiz
- UserDeleteConfirmation - Confirm deletion

---

### 2. **Quiz Management Dashboard**
**Endpoint:** `GET/POST/PUT/DELETE /api/quizzes`

**Features:**
- Create new quizzes (DRAFT status)
- View all quizzes with status
- Edit quiz title and description
- Delete quizzes (cascades deletion of questions, teams, submissions)
- Manage quiz lifecycle states

**Quiz Status States:**
- DRAFT - Being created/edited
- READY - Ready to be activated
- ACTIVE - Live session in progress
- ARCHIVED - Historical data preserved

**Components Needed:**
- QuizList/QuizTable - Display all quizzes with status, creation date, action buttons
- QuizForm - Create/Edit quiz details
- QuizDeleteConfirmation - Confirm deletion
- QuizStatusBadge - Visual status indicator

---

### 3. **Quiz Editor/Builder**
**Endpoint:** `GET/POST/PUT/DELETE /api/quizzes/{quizId}/questions`

**Features:**
- Add multiple-choice questions to quiz
- Edit/update question details
- Delete questions
- Reorder questions
- Specify question difficulty and type
- Manage answer options with correct answer selection

**Question Details:**
- Text content
- Question type (implied: multiple choice)
- Difficulty level
- Answer options
- Correct answer designation

**Components Needed:**
- QuestionEditor - Main editor for creating/editing questions
- QuestionList - Drag-and-drop list with question order management
- AnswerOptionsEditor - Manage multiple answer options
- DifficultySelector - Select question difficulty
- QuestionPreview - Preview how question appears to players

---

### 4. **Quiz State Management**
**Endpoints:** 
- `POST /api/quizzes/{id}/ready` - Transition to READY
- `POST /api/quizzes/{id}/archive` - Archive quiz
- `POST /api/quizzes/{id}/activate` - Activate session
- `POST /api/quizzes/{id}/deactivate` - Deactivate session
- `GET /api/quizzes/active` - Get active quiz

**Features:**
- Transition quiz from DRAFT → READY
- Activate a READY quiz for live play
- Deactivate active quiz
- Archive quiz for historical records
- View current active quiz

**Components Needed:**
- QuizStateTransitionButtons - Buttons for state transitions
- ActiveQuizIndicator - Show which quiz is currently active
- StateTransitionConfirmation - Confirm state changes

---

## ADMIN Pages & Features

### 1. **Team Management**
**Endpoint:** `GET/POST/DELETE /api/quizzes/{quizId}/teams` + `POST /api/quizzes/{quizId}/teams/reset-scores`

**Features:**
- Register/create new teams for a quiz
- View all teams in a quiz
- Generate unique access codes for teams
- Remove teams
- Reset team scores to zero

**Components Needed:**
- TeamList/TeamTable - Display teams with access codes, scores, actions
- RegisterTeamForm - Add new team
- AccessCodeDisplay - Show/copy generated access code
- TeamDeleteConfirmation - Confirm team deletion
- ResetScoresConfirmation - Confirm score reset

---

### 2. **Question Management (Partial)**
**Endpoint:** `GET /api/quizzes/{quizId}/questions` (read-only if only CAN_VIEW_DETAILS)

**Features (depends on permissions assigned):**
- View quiz questions
- Edit questions (if CAN_EDIT_CONTENT)
- Create questions (if CAN_EDIT_CONTENT)
- Delete questions (if CAN_EDIT_CONTENT)

**Components Needed:**
- QuestionViewer - Read-only question display
- QuestionEditor (conditional) - Only if CAN_EDIT_CONTENT
- QuestionPreview - Preview questions

---

### 3. **Live Game Host Controls**
**Endpoint:** `POST /api/quizzes/{id}/activate` + `POST /api/quizzes/{id}/deactivate`

**Features (if CAN_HOST_GAME):**
- Start/stop quiz session
- Control quiz progression
- Display proctor PIN
- Monitor live submissions in real-time
- Display scoreboard during play
- Pause/resume game

**Components Needed:**
- HostControls - Main control panel
- ProcatorPINDisplay - Show PIN for host
- LiveSubmissionMonitor - Real-time submission tracker
- GameTimerDisplay - Countdown timer
- LiveScoreboard - Real-time team standings

---

### 4. **Quiz Scoreboard**
**Endpoint:** `GET /api/quizzes/{quizId}/scoreboard`

**Features:**
- View team rankings by score
- Sort by score descending
- Handle ties (same rank for same score)
- Display team names and scores
- Update in real-time during active quiz

**Components Needed:**
- ScoreboardTable - Ranked team display
- ScoreboardStats - Summary statistics
- TeamRankingBadge - Visual rank indicator
- RealTimeScoreUpdate - Live score updates

---

## Cross-Functional Pages (Both SUPER_ADMIN & ADMIN)

### 1. **Authentication & Login**
- Already exists: `AuthController`
- JWT-based authentication

### 2. **Dashboard Overview**
**Features:**
- Summary of assigned quizzes (for ADMIN)
- Summary of all system data (for SUPER_ADMIN)
- Quick links to primary functions
- Recent activity

**Components Needed:**
- DashboardCard - Quick stat display
- QuickActionButton - Shortcut to common tasks
- RecentActivityList - Latest actions
- SystemStatusIndicator - System health

---

## API Endpoint Summary by Role

### SUPER_ADMIN Only
```
POST   /api/users                           → Create admin
GET    /api/users                           → List users (implied)
PUT    /api/users/{id}                      → Update admin
DELETE /api/users/{id}                      → Delete admin
POST   /api/users/{userId}/permissions      → Assign permissions
DELETE /api/users/{userId}/permissions/{quizId} → Revoke access
```

### SUPER_ADMIN & ADMIN (with CAN_EDIT_CONTENT permission)
```
POST   /api/quizzes                         → Create quiz
PUT    /api/quizzes/{id}                    → Update quiz
DELETE /api/quizzes/{id}                    → Delete quiz
POST   /api/quizzes/{id}/ready              → Transition to READY
POST   /api/quizzes/{id}/archive            → Archive quiz

POST   /api/quizzes/{quizId}/questions      → Add question
PUT    /api/questions/{id}                  → Update question
DELETE /api/questions/{id}                  → Delete question
POST   /api/quizzes/{quizId}/questions/reorder → Reorder questions
```

### SUPER_ADMIN & ADMIN (with CAN_MANAGE_TEAMS permission)
```
POST   /api/quizzes/{quizId}/teams          → Register team
DELETE /api/teams/{id}                      → Remove team
POST   /api/quizzes/{quizId}/teams/reset-scores → Reset scores
```

### SUPER_ADMIN & ADMIN (with CAN_HOST_GAME permission)
```
POST   /api/quizzes/{id}/activate           → Activate session
POST   /api/quizzes/{id}/deactivate         → Deactivate session
```

### SUPER_ADMIN & ADMIN (with CAN_VIEW_DETAILS permission)
```
GET    /api/quizzes                         → List all quizzes
GET    /api/quizzes/{id}                    → Get quiz details
GET    /api/quizzes/{quizId}/questions      → List questions
GET    /api/quizzes/{quizId}/teams          → List teams
GET    /api/quizzes/{quizId}/scoreboard     → Get scoreboard
GET    /api/quizzes/active                  → Get active quiz
```

---

## Frontend Component Hierarchy

### Pages Structure
```
AdminPanel/
├── UserManagement/
│   ├── UserList
│   ├── UserForm
│   ├── PermissionAssignmentModal
│   └── UserDeleteConfirmation
│
├── QuizManagement/
│   ├── QuizList
│   ├── QuizForm
│   ├── QuizDeleteConfirmation
│   └── QuizStatusBadge
│
├── QuizEditor/
│   ├── QuestionEditor
│   ├── QuestionList
│   ├── AnswerOptionsEditor
│   ├── DifficultySelector
│   └── QuestionPreview
│
├── TeamManagement/
│   ├── TeamList
│   ├── RegisterTeamForm
│   ├── AccessCodeDisplay
│   └── TeamDeleteConfirmation
│
├── HostControls/
│   ├── HostControlPanel
│   ├── ProcatorPINDisplay
│   ├── LiveSubmissionMonitor
│   ├── GameTimerDisplay
│   └── LiveScoreboard
│
└── Dashboard/
    ├── DashboardCard
    ├── QuickActionButton
    ├── RecentActivityList
    └── SystemStatusIndicator
```

---

## Key Implementation Notes

1. **Authorization**: All endpoints require JWT token and role/permission validation
2. **Permission-based UI**: Show/hide components based on admin's assigned permissions
3. **Real-time Updates**: Scoreboard and live game controls need WebSocket/real-time updates
4. **Cascading Operations**: Deleting quiz → delete questions, teams, submissions
5. **Quiz Lifecycle**: DRAFT → READY → ACTIVE ↔ DEACTIVATE → ARCHIVED
6. **Access Codes**: Auto-generated for teams, displayed to admin for sharing
7. **State Management**: Track current active quiz, prevent multiple simultaneous active quizzes
