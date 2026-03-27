# Independent Admin Quiz Ownership

## Objective
Enable each admin (ADMIN/EXAMINER role) to independently create and manage their own quizzes without requiring super admin assignment or permission grants.

## Current State
- Super Admin manually assigns quizzes to Admin users via `QuizAssignment` entity
- `QuizAssignment` tracks fine-grained permissions (CAN_VIEW_DETAILS, CAN_EDIT_CONTENT, CAN_MANAGE_TEAMS, CAN_HOST_GAME)
- Admin can only access quizzes they've been assigned to by super admin
- Quiz creation is allowed for ADMIN/EXAMINER roles, but requires subsequent assignment

## Target State
- Admin creates quiz → **automatically owns it** (no assignment needed)
- Admin has **full rights** to quizzes they created
- Admin has **no access** to quizzes created by other admins
- Super Admin can still view/manage all quizzes but doesn't assign them
- Question Bank remains personal per admin
- `QuizAssignment` becomes deprecated/optional (can be removed or kept for future fine-grained delegation)

## Functional Changes
1. **Quiz Access Control**
   - Ownership determined by `quiz.createdByUserId == currentUser.id`
   - No permission checks via `QuizAssignment`
   - Super Admin can view all (role-based bypass)

2. **Frontend Changes**
   - Remove QuizAssignment interface from PermissionsPage
   - Remove "Assign Quiz to Admin" workflows
   - Admins see only their own quizzes in dashboard
   - Super Admin sees all quizzes (read-only view)

3. **Backend Changes**
   - Simplify authorization checks to use ownership model
   - Remove `quizAssignmentRepository.findByUserAndQuizId()` calls
   - Replace with ownership checks: `quiz.getCreatedByUserId().equals(userId)`
   - Keep `QuizAssignment` entity but don't require it for basic access

## Implementation Tasks
1. Update `QuizController` — Remove assignment checks, use ownership
2. Update `TeamController` — Check quiz ownership
3. Update `QuestionController` — Check quiz ownership  
4. Update `ScoreboardController` — Check quiz ownership
5. Remove `PermissionsPage` quiz assignment modal and logic
6. Update `DashboardPage` to show only user's quizzes (or all for superadmin)
7. Update `QuizzesPage` to filter by ownership
8. Simplify `AuthContext` canEditQuiz/canManageTeams helpers
9. Database: No schema changes needed (createdByUserId already exists)

## Validation Checklist
1. Admin A creates Quiz X → Only Admin A can edit/manage it
2. Admin B tries to access Quiz X → Gets 403 Forbidden
3. Super Admin views Quiz X → Can see it but cannot edit (read-only or delegated)
4. Admin creates team on their own quiz → Works without assignment
5. Super Admin doesn't see "Assign Quiz" interface in PermissionsPage
6. Question Bank still works (already ownership-based)
