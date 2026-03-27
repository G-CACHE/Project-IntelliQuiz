# Role RBAC and Proctor Lifecycle Update

## Objective
Align system capabilities with operational roles:
- Super Admin: manage admin accounts, permission controls, and backups only.
- Admin (Examiner): create/manage quizzes, manage teams, and view scoreboard.
- Proctor: one-time session access for a quiz run; monitor participants and kick teams.
- Participant: answer quiz questions only.

## Scope
1. Backend authorization and lifecycle enforcement.
2. Frontend route/nav and dashboard capability boundaries.
3. Proctor one-time access behavior after quiz completion.

## Functional Requirements
1. Super Admin must not have quiz creation/editing modules in UI.
2. Admin must retain quiz authoring, team management, and scoreboard features.
3. Proctor PIN access must be rejected after quiz completion.
4. Proctor flow must support two operational views:
- Live host game window.
- Teams/users violation monitoring and manual kick window.

## Implementation Tasks
1. Tighten backend role checks to focus quiz CRUD/management on ADMIN and EXAMINER roles.
2. Keep Super Admin access for user management, assignment permissions, and backups.
3. On quiz end, deactivate and archive the quiz to invalidate PIN reuse.
4. Restrict access-code resolution for host/proctor to live or ready quizzes only.
5. Remove superadmin quiz/team/scoreboard pages from navigation and routing.
6. Update superadmin dashboard content and quick actions to user, permissions, backups.
7. Ensure frontend role checks accept both ADMIN and EXAMINER where admin capabilities are intended.
8. Add direct host->proctor monitor action to support dual-window operation.

## Validation Checklist
1. Super Admin login cannot navigate to quiz management modules.
2. Admin login can create/edit quizzes, manage teams, and view scoreboard.
3. Ending a quiz prevents proctor PIN login reuse for that quiz.
4. Proctor can open monitoring dashboard and perform manual kick actions.
