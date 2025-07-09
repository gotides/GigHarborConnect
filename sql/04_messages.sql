-- Messages table for Tide Talk chat system
-- Stores team communication messages across multiple channels

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'general',
    author_name TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_color TEXT NOT NULL,
    inappropriate TEXT NOT NULL DEFAULT 'false',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE messages IS 'Chat messages for Tide Talk communication system';
COMMENT ON COLUMN messages.id IS 'Auto-incrementing message ID';
COMMENT ON COLUMN messages.content IS 'Message text content';
COMMENT ON COLUMN messages.channel IS 'Chat channel: general, announcements, sports, homework-help, events';
COMMENT ON COLUMN messages.author_name IS 'Display name of message author';
COMMENT ON COLUMN messages.author_initials IS 'Author initials for avatar display';
COMMENT ON COLUMN messages.author_color IS 'Color code for author avatar';
COMMENT ON COLUMN messages.inappropriate IS 'Flag for inappropriate content moderation';
COMMENT ON COLUMN messages.created_at IS 'Message creation timestamp';

-- Channel constraint to ensure valid channels
ALTER TABLE messages ADD CONSTRAINT messages_channel_check 
CHECK (channel IN ('general', 'announcements', 'sports', 'homework-help', 'events'));

-- Inappropriate flag constraint
ALTER TABLE messages ADD CONSTRAINT messages_inappropriate_check 
CHECK (inappropriate IN ('true', 'false'));

-- Indexes for chat queries
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_channel_created_at ON messages(channel, created_at);