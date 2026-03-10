# Game Workflow & Active Proctoring — Requirements

## 1. Role Hierarchy

| Role | Scope / Responsibility | Spring Security Authority |
|------|----------------------|--------------------------|
| Super Admin | System maintenance, managing Examiner accounts | `ROLE_SUPER_ADMIN` |
| Examiner | Owner of the Question Bank. Creates and manages sets of quizzes | `ROLE_EXAMINER` |
| Proctor | Manages the specific "Quiz Session." Generates access code. Active supervision — monitors live violations, manages Auto-Kick threshold, manually kicks participants | `ROLE_PROCTOR` |
| Participant | Student or candidate taking the quiz | `ROLE_PARTICIPANT` |

> **Migration Note**: The existing `ADMIN` role maps to the new `EXAMINER` role. Existing `ADMIN` users become `EXAMINER` users.

## 2. Core Functional Modules

### A. Hybrid Question Bank & Persistence

- **Dual-Source Authoring**: Examiners populate a quiz by selecting items from their Question Bank OR typing Instant Questions directly.
- **Automatic Harvesting**: Any "Instant" question created during quiz building is automatically persisted into the Examiner's private Question Bank upon saving.
- **Data Isolation**: Questions are private to the creator (Examiner) unless administrative sharing is enabled.
- **Question Bank Entity Fields**: text, type, difficulty, correctKey, options, createdByUserId, createdAt, tags/category (optional).

### B. Assessment Modes (Navigation & Timing)

The Examiner defines the assessment mode before it goes live:

| Mode | Name | Timer | Navigation | Behavior |
|------|------|-------|------------|----------|
| `LINEAR` | Strict Progression | Per-question timer | Forward-only | Once submitted or time expires, locked out, moved forward automatically |
| `NON_LINEAR` | Participant-Controlled | Global "Whole Quiz" timer | Free navigation | Question Palette UI to jump between questions, review answers freely |

### C. Active Proctoring & Anti-Cheating

#### Real-Time Violation Tracking
- **Tab-Switch Detection**: Frontend monitors `visibilitychange` and `window.onblur`. Sends signal via STOMP/WebSocket.
- **Violation Counter**: Backend increments a "Switch Count" per participant, broadcasts instantly to Proctor Dashboard.

#### Proctor Enforcement Controls
- **Manual Kick**: Proctor can instantly disqualify a participant via dashboard.
- **Auto-Kick Threshold**: Proctor sets a numeric limit. System automatically terminates session when reached.
- **UI/UX Blocking**: React app disables right-click, text selection, and common shortcuts (Ctrl+C, Ctrl+V, PrintScreen).

## 3. Typical System Workflow

1. **Creation**: Examiner builds a quiz — pulls questions from bank + writes instant questions. Sets timer mode (Linear/Non-Linear).
2. **Initialization**: Proctor enters the session with a One-Time Access Code.
3. **Security Setup**: Proctor sets the Auto-Kick Threshold on the dashboard.
4. **Live Session**: Participants begin the quiz.
5. **Violation**: A participant switches tabs → Proctor sees violation count increment.
6. **Enforcement**: Participant exceeds Auto-Kick Threshold → system automatically terminates their session.
7. **Finalization**: Once all students finish or time expires, Proctor closes session, results available to Examiner.
