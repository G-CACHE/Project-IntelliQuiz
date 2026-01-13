# IntelliQuiz Database Design Overview


This directory contains the three design levels of the IntelliQuiz database model:

- `conceptual-db.mmd` — High-level conceptual model describing the major entities and relationships at a business level. Updated to reflect the new core entities: User, Quiz, Team, Question, Submission, QuizAssignment, AssignmentPermission, and their associations.

- `logical-db.mmd` — Normalized logical model describing tables, attributes, primary/foreign keys, and all association/junction tables (like `quiz_assignment` and `assignment_permission`). This model abstracts away physical types and is now aligned with the backend's current structure.

- `physical-db.mmd` — Physical model mapping tables to real database column types, including enum usage, composite/unique constraints, and foreign key relationships. This is suitable for DBA, migrations, and optimization guidance.

Guidelines:
- All table names use singular naming conventions per the project's design (e.g., `user`, `quiz`, `team`, `question`, `submission`, `quiz_assignment`, `assignment_permission`).
- User-to-quiz permissions are managed through `quiz_assignment` and `assignment_permission` tables, supporting fine-grained, per-quiz admin permissions.
- Legacy role/permission tables are now deprecated in favor of the new assignment-based permission model.

Where to use:
- Conceptual model: Stakeholder reviews
- Logical model: Schema design & application modeling
- Physical model: DBA, migrations, and optimization guidance
