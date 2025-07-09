-- Tides Hub - Complete Database Schema
-- Full DDL for Gig Harbor High School Water Polo Team Application
-- Updated: July 09, 2025

-- =================================================================
-- SESSIONS TABLE - Authentication Session Storage
-- =================================================================

CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions(expire);

COMMENT ON TABLE sessions IS 'Session storage for Replit Auth - stores user authentication sessions';

-- =================================================================
-- USERS TABLE - User Management with Role-Based Access Control
-- =================================================================

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

ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Administrator', 'Editor', 'Contributor', 'Viewer', 'Guest'));

COMMENT ON TABLE users IS 'User accounts for Tides Hub - integrated with Replit Auth';

-- =================================================================
-- EVENTS TABLE - Calendar and Event Management
-- =================================================================

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location TEXT,
    category TEXT NOT NULL DEFAULT 'games',
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE events ADD CONSTRAINT events_category_check 
CHECK (category IN ('games', 'team-events', 'practice', 'training', 'team-meetings', 'award-ceremonies'));

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);

COMMENT ON TABLE events IS 'Team events for Tides Girls Water Polo calendar';

-- =================================================================
-- MESSAGES TABLE - Tide Talk Chat System
-- =================================================================

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'general',
    author_name TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_id TEXT NOT NULL DEFAULT '',
    author_color TEXT NOT NULL,
    inappropriate TEXT NOT NULL DEFAULT 'false',
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE messages ADD CONSTRAINT messages_channel_check 
CHECK (channel IN ('general', 'announcements', 'sports', 'homework-help', 'events'));

ALTER TABLE messages ADD CONSTRAINT messages_inappropriate_check 
CHECK (inappropriate IN ('true', 'false'));

CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_author_id ON messages(author_id);

COMMENT ON TABLE messages IS 'Chat messages for Tide Talk communication system';

-- =================================================================
-- PHOTOS TABLE - Tide Memories Photo Gallery
-- =================================================================

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    event TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE photos ADD CONSTRAINT photos_mime_type_check 
CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'));

ALTER TABLE photos ADD CONSTRAINT photos_size_check 
CHECK (size > 0 AND size <= 10485760);

CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX idx_photos_event ON photos(event);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);

COMMENT ON TABLE photos IS 'Photo gallery for Tide Memories - team photo sharing';

-- =================================================================
-- PROFILES TABLE - Team Member Profiles with Roles
-- =================================================================

CREATE TABLE profiles (
    id VARCHAR PRIMARY KEY NOT NULL REFERENCES users(id),
    name VARCHAR NOT NULL,
    phoneNumber VARCHAR,
    emailAddress VARCHAR NOT NULL,
    profilePhoto VARCHAR,
    teamRole TEXT DEFAULT 'player',
    playerNumber TEXT,
    playerName TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT profiles_team_role_check 
CHECK (teamRole IN ('player', 'coach', 'parent'));

CREATE INDEX idx_profiles_team_role ON profiles(teamRole);

COMMENT ON TABLE profiles IS 'Team member profiles with roles and player information';

-- =================================================================
-- INITIAL DATA
-- =================================================================

-- Insert default administrator accounts
INSERT INTO users (id, email, first_name, last_name, role) VALUES 
('44503831', 'robn96793@gmail.com', 'Rob', 'Nelson', 'Administrator'),
('44695004', 'tidesgirlspolo@gmail.com', 'tides-admin', 'ghhs', 'Administrator')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

-- =================================================================
-- END OF SCHEMA
-- =================================================================