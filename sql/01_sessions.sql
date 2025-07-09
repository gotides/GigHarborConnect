-- Sessions table for Replit Auth session storage
-- This table is required for authentication session management

CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Index for session expiration cleanup
CREATE INDEX IDX_session_expire ON sessions(expire);

-- Comments
COMMENT ON TABLE sessions IS 'Session storage for Replit Auth - stores user authentication sessions';
COMMENT ON COLUMN sessions.sid IS 'Session identifier - primary key';
COMMENT ON COLUMN sessions.sess IS 'Session data stored as JSON';
COMMENT ON COLUMN sessions.expire IS 'Session expiration timestamp';