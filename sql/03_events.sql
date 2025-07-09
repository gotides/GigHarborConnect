-- Events table for Tides Hub calendar system
-- Stores water polo team events, games, practices, and meetings

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

-- Comments
COMMENT ON TABLE events IS 'Team events for Tides Girls Water Polo calendar';
COMMENT ON COLUMN events.id IS 'Auto-incrementing event ID';
COMMENT ON COLUMN events.title IS 'Event title/name';
COMMENT ON COLUMN events.description IS 'Event description or details';
COMMENT ON COLUMN events.start_date IS 'Event start date and time';
COMMENT ON COLUMN events.end_date IS 'Event end date and time (optional)';
COMMENT ON COLUMN events.location IS 'Event location/venue';
COMMENT ON COLUMN events.category IS 'Event category: games, team-events, practice, training, team-meetings, award-ceremonies';
COMMENT ON COLUMN events.created_by IS 'User ID who created the event';
COMMENT ON COLUMN events.created_at IS 'Event creation timestamp';

-- Category constraint to ensure valid categories
ALTER TABLE events ADD CONSTRAINT events_category_check 
CHECK (category IN ('games', 'team-events', 'practice', 'training', 'team-meetings', 'award-ceremonies'));

-- Index for date-based queries
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);