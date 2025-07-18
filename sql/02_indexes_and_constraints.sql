-- Tides Girls Water Polo Platform - Indexes and Constraints DDL
-- Generated: July 17, 2025
-- This file contains all indexes, foreign keys, and constraints

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Session expiration index for cleanup operations
CREATE INDEX idx_session_expire ON sessions USING btree (expire);

-- User email unique index (created automatically with UNIQUE constraint)
-- CREATE UNIQUE INDEX users_email_key ON users USING btree (email);

-- Hashtag name unique index (created automatically with UNIQUE constraint)
-- CREATE UNIQUE INDEX hashtags_name_key ON hashtags USING btree (name);

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Events foreign key to users (created_by)
ALTER TABLE events 
ADD CONSTRAINT events_created_by_users_id_fk 
FOREIGN KEY (created_by) REFERENCES users(id);

-- Profiles foreign key to users (id)
-- Already defined in table creation: REFERENCES users(id)

-- Hashtags foreign key to users (created_by)
ALTER TABLE hashtags 
ADD CONSTRAINT hashtags_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id);

-- =============================================================================
-- UNIQUE CONSTRAINTS
-- =============================================================================

-- User email uniqueness (already defined in table creation)
-- ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Hashtag name uniqueness (already defined in table creation)
-- ALTER TABLE hashtags ADD CONSTRAINT hashtags_name_key UNIQUE (name);

-- =============================================================================
-- CHECK CONSTRAINTS (Optional - for additional data validation)
-- =============================================================================

-- Role validation constraint
ALTER TABLE users 
ADD CONSTRAINT check_user_role 
CHECK (role IN ('Administrator', 'Editor', 'Contributor', 'Viewer', 'Guest'));

-- Event category validation constraint
ALTER TABLE events 
ADD CONSTRAINT check_event_category 
CHECK (category IN ('games', 'team events', 'practice', 'training', 'team meetings', 'award ceremonies'));

-- Message channel validation constraint
ALTER TABLE messages 
ADD CONSTRAINT check_message_channel 
CHECK (channel IN ('general', 'announcements', 'sports', 'homework-help', 'events'));

-- Team role validation constraint
ALTER TABLE profiles 
ADD CONSTRAINT check_team_role 
CHECK ("teamRole" IN ('player', 'coach', 'parent'));

-- Access request disposition validation constraint
ALTER TABLE access_requests 
ADD CONSTRAINT check_disposition 
CHECK (disposition IN ('pending', 'granted', 'denied'));

-- Boolean-like text validation for hashtags
ALTER TABLE hashtags 
ADD CONSTRAINT check_is_active 
CHECK (is_active IN ('true', 'false'));

-- Boolean-like text validation for messages
ALTER TABLE messages 
ADD CONSTRAINT check_inappropriate 
CHECK (inappropriate IN ('true', 'false'));

-- Boolean-like text validation for events schedule_food
ALTER TABLE events 
ADD CONSTRAINT check_schedule_food 
CHECK (schedule_food IN ('true', 'false'));

-- =============================================================================
-- PERFORMANCE INDEXES (Optional - add based on query patterns)
-- =============================================================================

-- Index for events by date range (common query pattern)
CREATE INDEX idx_events_date_range ON events (start_date, end_date);

-- Index for events by category (filtering)
CREATE INDEX idx_events_category ON events (category);

-- Index for messages by channel (filtering)
CREATE INDEX idx_messages_channel ON messages (channel);

-- Index for messages by creation date (sorting)
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);

-- Index for photos by event (filtering)
CREATE INDEX idx_photos_event ON photos (event) WHERE event IS NOT NULL;

-- Index for photos by upload date (sorting)
CREATE INDEX idx_photos_uploaded_at ON photos (uploaded_at DESC);

-- Index for access requests by disposition (admin filtering)
CREATE INDEX idx_access_requests_disposition ON access_requests (disposition);

-- Index for hashtags by active status (filtering)
CREATE INDEX idx_hashtags_active ON hashtags (is_active);