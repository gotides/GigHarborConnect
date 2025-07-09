-- Users table for Tides Hub application
-- Stores user information with role-based access control

CREATE TABLE users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE users IS 'User accounts for Tides Hub - integrated with Replit Auth';
COMMENT ON COLUMN users.id IS 'Replit user ID - serves as primary key';
COMMENT ON COLUMN users.email IS 'User email address - unique constraint';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile image from Replit';
COMMENT ON COLUMN users.role IS 'User role: Administrator, Editor, Contributor, Viewer, Guest';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last account update timestamp';

-- Role constraint to ensure valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Administrator', 'Editor', 'Contributor', 'Viewer', 'Guest'));