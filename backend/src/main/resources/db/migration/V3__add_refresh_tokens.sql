-- V3__add_refresh_tokens.sql
-- Refresh token storage for JWT rotation

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  TEXT        NOT NULL UNIQUE,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username    TEXT        NOT NULL,
    role        TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
