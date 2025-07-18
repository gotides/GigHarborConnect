-- Tides Girls Water Polo Platform - Sample Data DDL
-- Generated: July 17, 2025
-- This file contains sample data for initial setup and testing

-- =============================================================================
-- SAMPLE HASHTAGS
-- =============================================================================

INSERT INTO hashtags (name, description, is_active) VALUES
('#announcements', 'Important team announcements and updates', 'true'),
('#games', 'Game schedules, results, and discussions', 'true'),
('#practice', 'Practice schedules and reminders', 'true'),
('#social', 'Team social events and activities', 'true'),
('#homework', 'Academic support and study groups', 'true'),
('#travel', 'Travel information for away games', 'true'),
('#equipment', 'Equipment needs and maintenance', 'true'),
('#fundraising', 'Team fundraising activities and events', 'true'),
('#photos', 'Photo sharing and memory posts', 'true'),
('#congratulations', 'Celebrating team and individual achievements', 'true');

-- =============================================================================
-- SAMPLE USERS (Optional - for testing only)
-- =============================================================================

-- Note: In production, users are created through Replit Auth
-- These are examples of the data structure only

/*
INSERT INTO users (id, email, first_name, last_name, role) VALUES
('admin_user_1', 'admin@example.com', 'Admin', 'User', 'Administrator'),
('editor_user_1', 'editor@example.com', 'Editor', 'User', 'Editor'),
('contributor_user_1', 'contributor@example.com', 'Contributor', 'User', 'Contributor'),
('viewer_user_1', 'viewer@example.com', 'Viewer', 'User', 'Viewer');
*/

-- =============================================================================
-- SAMPLE EVENTS (Optional - for testing only)
-- =============================================================================

/*
INSERT INTO events (title, description, start_date, end_date, location, category, created_by) VALUES
('Practice Session', 'Weekly team practice', '2025-07-20 15:00:00', '2025-07-20 17:00:00', 'Pool Complex', 'practice', 'admin_user_1'),
('vs. Harbor Heights', 'Away game against Harbor Heights High School', '2025-07-25 14:00:00', '2025-07-25 16:00:00', 'Harbor Heights Pool', 'games', 'admin_user_1'),
('Team Dinner', 'End of season team celebration', '2025-08-01 18:00:00', '2025-08-01 21:00:00', 'Gig Harbor Community Center', 'team events', 'admin_user_1');
*/

-- =============================================================================
-- SAMPLE MESSAGES (Optional - for testing only)
-- =============================================================================

/*
INSERT INTO messages (content, channel, author_name, author_initials, author_id, author_color) VALUES
('#announcements Great job everyone at practice today! Keep up the hard work!', 'announcements', 'Coach Smith', 'CS', 'admin_user_1', '#2563eb'),
('Who needs a ride to the game on Friday? #games', 'general', 'Sarah Johnson', 'SJ', 'contributor_user_1', '#dc2626'),
('Study group meeting tomorrow at 4pm in the library #homework', 'homework-help', 'Emma Davis', 'ED', 'viewer_user_1', '#059669');
*/

-- =============================================================================
-- DATABASE MAINTENANCE QUERIES
-- =============================================================================

-- Clean up expired sessions (run periodically)
-- DELETE FROM sessions WHERE expire < NOW();

-- View all tables and their row counts
/*
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY tablename, attname;
*/

-- View database size information
/*
SELECT 
    pg_size_pretty(pg_total_relation_size('sessions')) as sessions_size,
    pg_size_pretty(pg_total_relation_size('users')) as users_size,
    pg_size_pretty(pg_total_relation_size('events')) as events_size,
    pg_size_pretty(pg_total_relation_size('messages')) as messages_size,
    pg_size_pretty(pg_total_relation_size('photos')) as photos_size,
    pg_size_pretty(pg_total_relation_size('profiles')) as profiles_size,
    pg_size_pretty(pg_total_relation_size('hashtags')) as hashtags_size,
    pg_size_pretty(pg_total_relation_size('access_requests')) as access_requests_size;
*/