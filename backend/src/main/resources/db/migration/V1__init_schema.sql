-- V1__init_schema.sql
-- Initial schema for IntelliQuiz domain entities

-- 1. USERS table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    system_role TEXT NOT NULL
);

-- 2. QUIZZES table
CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    proctor_pin TEXT NOT NULL,
    is_live_session BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT
);

-- 3. QUIZ_ASSIGNMENTS table (maps users to quizzes with permissions)
CREATE TABLE quiz_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT quiz_assignments_user_quiz_unique UNIQUE (user_id, quiz_id)
);

-- 4. ASSIGNMENT_PERMISSIONS table (ElementCollection for AdminPermission enum)
CREATE TABLE assignment_permissions (
    assignment_id BIGINT NOT NULL REFERENCES quiz_assignments(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    PRIMARY KEY (assignment_id, permission)
);

-- 5. QUESTIONS table
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT,
    difficulty TEXT,
    correct_key TEXT NOT NULL,
    points INT DEFAULT 0,
    time_limit INT DEFAULT 0,
    order_index INT DEFAULT 0
);

-- 6. QUESTION_OPTIONS table (ElementCollection for multiple-choice options)
CREATE TABLE question_options (
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL
);

-- 7. TEAMS table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    total_score INT DEFAULT 0
);

-- 8. SUBMISSIONS table
CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    awarded_points INT DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_quiz_assignments_user_id ON quiz_assignments(user_id);
CREATE INDEX idx_quiz_assignments_quiz_id ON quiz_assignments(quiz_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_teams_quiz_id ON teams(quiz_id);
CREATE INDEX idx_teams_access_code ON teams(access_code);
CREATE INDEX idx_submissions_team_id ON submissions(team_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);
