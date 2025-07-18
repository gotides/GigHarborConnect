-- Tides Girls Water Polo Platform - Maintenance and Views DDL
-- Generated: July 17, 2025
-- This file contains maintenance procedures, views, and utility functions

-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- View for active hashtags with usage statistics
CREATE OR REPLACE VIEW active_hashtags AS
SELECT 
    h.id,
    h.name,
    h.description,
    h.created_at,
    COUNT(m.id) as message_count
FROM hashtags h
LEFT JOIN messages m ON m.content LIKE '%' || h.name || '%'
WHERE h.is_active = 'true'
GROUP BY h.id, h.name, h.description, h.created_at
ORDER BY message_count DESC, h.name;

-- View for recent team activity (last 30 days)
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'event' as activity_type,
    e.title as title,
    e.description as description,
    u.first_name || ' ' || u.last_name as created_by_name,
    e.created_at
FROM events e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'message' as activity_type,
    LEFT(m.content, 50) || '...' as title,
    m.channel as description,
    m.author_name as created_by_name,
    m.created_at
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'photo' as activity_type,
    p.title as title,
    p.event as description,
    p.uploaded_by as created_by_name,
    p.uploaded_at as created_at
FROM photos p
WHERE p.uploaded_at >= NOW() - INTERVAL '30 days'

ORDER BY created_at DESC;

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as full_name,
    u.email,
    u.role,
    u.created_at as joined_date,
    COUNT(DISTINCT e.id) as events_created,
    COUNT(DISTINCT m.id) as messages_sent,
    COUNT(DISTINCT p.id) as photos_uploaded
FROM users u
LEFT JOIN events e ON e.created_by = u.id
LEFT JOIN messages m ON m.author_id = u.id
LEFT JOIN photos p ON p.uploaded_by = u.first_name || ' ' || u.last_name
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at
ORDER BY u.created_at;

-- View for pending access requests
CREATE OR REPLACE VIEW pending_access_requests AS
SELECT 
    ar.id,
    ar.requester_name,
    ar.requester_email,
    ar.relationship,
    ar.reason,
    ar.created_at,
    EXTRACT(DAYS FROM NOW() - ar.created_at) as days_pending
FROM access_requests ar
WHERE ar.disposition = 'pending'
ORDER BY ar.created_at;

-- =============================================================================
-- MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expire < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get database size summary
CREATE OR REPLACE FUNCTION get_database_size_summary()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.row_count,
        pg_size_pretty(t.table_size) as table_size,
        pg_size_pretty(t.index_size) as index_size,
        pg_size_pretty(t.total_size) as total_size
    FROM (
        SELECT 
            schemaname||'.'||tablename as table_name,
            n_tup_ins - n_tup_del as row_count,
            pg_relation_size(schemaname||'.'||tablename) as table_size,
            pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename) as index_size,
            pg_total_relation_size(schemaname||'.'||tablename) as total_size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
    ) t
    ORDER BY t.total_size DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old messages (optional)
CREATE OR REPLACE FUNCTION archive_old_messages(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Create archive table if it doesn't exist
    CREATE TABLE IF NOT EXISTS messages_archive (
        LIKE messages INCLUDING ALL
    );
    
    -- Move old messages to archive
    WITH moved_messages AS (
        DELETE FROM messages 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_old
        RETURNING *
    )
    INSERT INTO messages_archive 
    SELECT * FROM moved_messages;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- REPORTING QUERIES
-- =============================================================================

-- Monthly activity report
CREATE OR REPLACE VIEW monthly_activity_report AS
SELECT 
    DATE_TRUNC('month', activity_date) as month,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE activity_type = 'event') as events_created,
    COUNT(*) FILTER (WHERE activity_type = 'message') as messages_sent,
    COUNT(*) FILTER (WHERE activity_type = 'photo') as photos_uploaded
FROM (
    SELECT 'event' as activity_type, created_at as activity_date FROM events
    UNION ALL
    SELECT 'message' as activity_type, created_at as activity_date FROM messages  
    UNION ALL
    SELECT 'photo' as activity_type, uploaded_at as activity_date FROM photos
) activities
WHERE activity_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', activity_date)
ORDER BY month DESC;

-- Channel usage statistics
CREATE OR REPLACE VIEW channel_usage_stats AS
SELECT 
    channel,
    COUNT(*) as message_count,
    COUNT(DISTINCT author_id) as unique_authors,
    MIN(created_at) as first_message,
    MAX(created_at) as last_message,
    AVG(LENGTH(content)) as avg_message_length
FROM messages
GROUP BY channel
ORDER BY message_count DESC;

-- =============================================================================
-- BACKUP AND RESTORE UTILITIES
-- =============================================================================

-- Function to create a data snapshot
CREATE OR REPLACE FUNCTION create_data_snapshot()
RETURNS TEXT AS $$
DECLARE
    snapshot_info TEXT;
BEGIN
    SELECT INTO snapshot_info
        'Snapshot created at: ' || NOW()::TEXT || E'\n' ||
        'Users: ' || (SELECT COUNT(*) FROM users)::TEXT || E'\n' ||
        'Events: ' || (SELECT COUNT(*) FROM events)::TEXT || E'\n' ||
        'Messages: ' || (SELECT COUNT(*) FROM messages)::TEXT || E'\n' ||
        'Photos: ' || (SELECT COUNT(*) FROM photos)::TEXT || E'\n' ||
        'Profiles: ' || (SELECT COUNT(*) FROM profiles)::TEXT || E'\n' ||
        'Hashtags: ' || (SELECT COUNT(*) FROM hashtags)::TEXT || E'\n' ||
        'Access Requests: ' || (SELECT COUNT(*) FROM access_requests)::TEXT;
    
    RETURN snapshot_info;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECURITY AND AUDIT
-- =============================================================================

-- View for user activity audit
CREATE OR REPLACE VIEW user_activity_audit AS
SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as user_name,
    u.role,
    'event_created' as action,
    e.title as resource,
    e.created_at as action_time
FROM users u
JOIN events e ON e.created_by = u.id

UNION ALL

SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as user_name,
    u.role,
    'message_sent' as action,
    LEFT(m.content, 50) as resource,
    m.created_at as action_time
FROM users u
JOIN messages m ON m.author_id = u.id

ORDER BY action_time DESC;

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

/*
-- Clean up expired sessions
SELECT cleanup_expired_sessions();

-- Get database size summary
SELECT * FROM get_database_size_summary();

-- View recent activity
SELECT * FROM recent_activity LIMIT 20;

-- Get user statistics
SELECT * FROM user_statistics;

-- Archive messages older than 2 years
SELECT archive_old_messages(730);

-- Create data snapshot
SELECT create_data_snapshot();

-- View monthly activity report
SELECT * FROM monthly_activity_report;

-- Check channel usage
SELECT * FROM channel_usage_stats;
*/