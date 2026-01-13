# SQL Command Reference for IntelliQuiz Repositories

This document lists the PostgreSQL SQL equivalents for all JPA repository methods used in the IntelliQuiz project.

## Table Definitions

### quiz
```sql
CREATE TABLE quiz (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    proctor_pin VARCHAR(255) NOT NULL,
    is_live_session BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50)  -- DRAFT, READY, ARCHIVED
);
```

### question
```sql
CREATE TABLE question (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id),
    text TEXT NOT NULL,
    type VARCHAR(50),  -- MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
    difficulty VARCHAR(50),  -- EASY, MEDIUM, HARD
    correct_key VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0,
    time_limit INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE question_option (
    question_id BIGINT NOT NULL REFERENCES question(id),
    option_text VARCHAR(255)
);
```

### team
```sql
CREATE TABLE team (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id),
    name VARCHAR(255) NOT NULL,
    access_code VARCHAR(255) NOT NULL,
    total_score INTEGER DEFAULT 0
);
```

### "user" (quoted because user is a reserved keyword)
```sql
CREATE TABLE "user" (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    system_role VARCHAR(50) NOT NULL  -- SUPER_ADMIN, ADMIN
);
```

### submission
```sql
CREATE TABLE submission (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES team(id),
    question_id BIGINT NOT NULL REFERENCES question(id),
    submitted_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    awarded_points INTEGER DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL,
    is_graded BOOLEAN DEFAULT FALSE
);
```

### quiz_assignment
```sql
CREATE TABLE quiz_assignment (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(id),
    quiz_id BIGINT NOT NULL REFERENCES quiz(id),
    UNIQUE(user_id, quiz_id)
);

CREATE TABLE assignment_permission (
    assignment_id BIGINT NOT NULL REFERENCES quiz_assignment(id),
    permission VARCHAR(50)  -- VIEW, EDIT, DELETE, MANAGE_TEAMS, etc.
);
```

### backup_record
```sql
CREATE TABLE backup_record (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,  -- IN_PROGRESS, SUCCESS, FAILED
    error_message TEXT,
    last_restored_at TIMESTAMP,
    created_by_user_id BIGINT REFERENCES "user"(id)
);
```

---

## Repository Methods and SQL Equivalents

### SpringQuizRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(Quiz quiz)` | `INSERT INTO quiz (title, description, proctor_pin, is_live_session, status) VALUES ($1, $2, $3, $4, $5) RETURNING *;` or `UPDATE quiz SET title=$1, description=$2, proctor_pin=$3, is_live_session=$4, status=$5 WHERE id=$6;` |
| `findById(Long id)` | `SELECT * FROM quiz WHERE id = $1;` |
| `findAll()` | `SELECT * FROM quiz;` |
| `deleteById(Long id)` | `DELETE FROM quiz WHERE id = $1;` |
| `delete(Quiz quiz)` | `DELETE FROM quiz WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM quiz WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM quiz;` |
| `findByIsLiveSessionTrue()` | `SELECT * FROM quiz WHERE is_live_session = TRUE;` |

---

### SpringQuestionRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(Question question)` | `INSERT INTO question (quiz_id, text, type, difficulty, correct_key, points, time_limit, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;` or `UPDATE question SET quiz_id=$1, text=$2, type=$3, difficulty=$4, correct_key=$5, points=$6, time_limit=$7, order_index=$8 WHERE id=$9;` |
| `findById(Long id)` | `SELECT * FROM question WHERE id = $1;` |
| `findAll()` | `SELECT * FROM question;` |
| `deleteById(Long id)` | `DELETE FROM question WHERE id = $1;` |
| `delete(Question question)` | `DELETE FROM question WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM question WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM question;` |
| `findByQuiz(Quiz quiz)` | `SELECT * FROM question WHERE quiz_id = $1;` |
| `findByQuizOrderByOrderIndex(Quiz quiz)` | `SELECT * FROM question WHERE quiz_id = $1 ORDER BY order_index ASC;` |

---

### SpringTeamRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(Team team)` | `INSERT INTO team (quiz_id, name, access_code, total_score) VALUES ($1, $2, $3, $4) RETURNING *;` or `UPDATE team SET quiz_id=$1, name=$2, access_code=$3, total_score=$4 WHERE id=$5;` |
| `findById(Long id)` | `SELECT * FROM team WHERE id = $1;` |
| `findAll()` | `SELECT * FROM team;` |
| `deleteById(Long id)` | `DELETE FROM team WHERE id = $1;` |
| `delete(Team team)` | `DELETE FROM team WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM team WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM team;` |
| `findByAccessCode(String accessCode)` | `SELECT * FROM team WHERE access_code = $1;` |
| `findByQuiz(Quiz quiz)` | `SELECT * FROM team WHERE quiz_id = $1;` |

---

### SpringUserRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(User user)` | `INSERT INTO "user" (username, password, system_role) VALUES ($1, $2, $3) RETURNING *;` or `UPDATE "user" SET username=$1, password=$2, system_role=$3 WHERE id=$4;` |
| `findById(Long id)` | `SELECT * FROM "user" WHERE id = $1;` |
| `findAll()` | `SELECT * FROM "user";` |
| `deleteById(Long id)` | `DELETE FROM "user" WHERE id = $1;` |
| `delete(User user)` | `DELETE FROM "user" WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM "user" WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM "user";` |
| `findByUsername(String username)` | `SELECT * FROM "user" WHERE username = $1;` |
| `existsByUsername(String username)` | `SELECT EXISTS(SELECT 1 FROM "user" WHERE username = $1);` |

---

### SpringSubmissionRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(Submission submission)` | `INSERT INTO submission (team_id, question_id, submitted_answer, is_correct, awarded_points, submitted_at, is_graded) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;` or `UPDATE submission SET team_id=$1, question_id=$2, submitted_answer=$3, is_correct=$4, awarded_points=$5, submitted_at=$6, is_graded=$7 WHERE id=$8;` |
| `findById(Long id)` | `SELECT * FROM submission WHERE id = $1;` |
| `findAll()` | `SELECT * FROM submission;` |
| `deleteById(Long id)` | `DELETE FROM submission WHERE id = $1;` |
| `delete(Submission submission)` | `DELETE FROM submission WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM submission WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM submission;` |
| `findByTeam(Team team)` | `SELECT * FROM submission WHERE team_id = $1;` |
| `findByQuestion(Question question)` | `SELECT * FROM submission WHERE question_id = $1;` |
| `findByTeamAndQuestion(Team team, Question question)` | `SELECT * FROM submission WHERE team_id = $1 AND question_id = $2;` |

---

### SpringQuizAssignmentRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(QuizAssignment assignment)` | `INSERT INTO quiz_assignment (user_id, quiz_id) VALUES ($1, $2) RETURNING *;` or `UPDATE quiz_assignment SET user_id=$1, quiz_id=$2 WHERE id=$3;` |
| `findById(Long id)` | `SELECT * FROM quiz_assignment WHERE id = $1;` |
| `findAll()` | `SELECT * FROM quiz_assignment;` |
| `deleteById(Long id)` | `DELETE FROM quiz_assignment WHERE id = $1;` |
| `delete(QuizAssignment assignment)` | `DELETE FROM quiz_assignment WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM quiz_assignment WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM quiz_assignment;` |
| `findByUserAndQuiz(User user, Quiz quiz)` | `SELECT * FROM quiz_assignment WHERE user_id = $1 AND quiz_id = $2;` |
| `findByUser(User user)` | `SELECT * FROM quiz_assignment WHERE user_id = $1;` |
| `findByQuiz(Quiz quiz)` | `SELECT * FROM quiz_assignment WHERE quiz_id = $1;` |

---

### BackupRecordRepository

| Method | SQL Equivalent |
|--------|----------------|
| `save(BackupRecord record)` | `INSERT INTO backup_record (filename, created_at, file_size_bytes, status, error_message, last_restored_at, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;` or `UPDATE backup_record SET filename=$1, created_at=$2, file_size_bytes=$3, status=$4, error_message=$5, last_restored_at=$6, created_by_user_id=$7 WHERE id=$8;` |
| `findById(Long id)` | `SELECT * FROM backup_record WHERE id = $1;` |
| `findAll()` | `SELECT * FROM backup_record;` |
| `deleteById(Long id)` | `DELETE FROM backup_record WHERE id = $1;` |
| `delete(BackupRecord record)` | `DELETE FROM backup_record WHERE id = $1;` |
| `existsById(Long id)` | `SELECT EXISTS(SELECT 1 FROM backup_record WHERE id = $1);` |
| `count()` | `SELECT COUNT(*) FROM backup_record;` |
| `findAllByOrderByCreatedAtDesc()` | `SELECT * FROM backup_record ORDER BY created_at DESC;` |

---

## Notes

- `$1, $2, ...` represent parameterized query placeholders (PostgreSQL style)
- `save()` performs INSERT when entity has no ID, UPDATE when entity has an existing ID
- All `find*` methods return `Optional<T>` or `List<T>` in Java
- JPA handles the `RETURNING *` clause internally for INSERT operations
- Collection tables (`question_option`, `assignment_permission`) are managed automatically by JPA's `@ElementCollection`
