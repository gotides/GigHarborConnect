-- Photos table for Tide Memories photo sharing system
-- Stores team photos and memories with metadata

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

-- Comments
COMMENT ON TABLE photos IS 'Photo gallery for Tide Memories - team photo sharing';
COMMENT ON COLUMN photos.id IS 'Auto-incrementing photo ID';
COMMENT ON COLUMN photos.title IS 'Photo title or caption';
COMMENT ON COLUMN photos.description IS 'Photo description or details';
COMMENT ON COLUMN photos.filename IS 'Stored filename on server';
COMMENT ON COLUMN photos.original_name IS 'Original filename from upload';
COMMENT ON COLUMN photos.mime_type IS 'File MIME type (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN photos.size IS 'File size in bytes';
COMMENT ON COLUMN photos.event IS 'Associated event name or occasion';
COMMENT ON COLUMN photos.uploaded_by IS 'User who uploaded the photo';
COMMENT ON COLUMN photos.uploaded_at IS 'Photo upload timestamp';

-- MIME type constraint for image files
ALTER TABLE photos ADD CONSTRAINT photos_mime_type_check 
CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'));

-- Size constraint (max 10MB)
ALTER TABLE photos ADD CONSTRAINT photos_size_check 
CHECK (size > 0 AND size <= 10485760);

-- Indexes for photo queries
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX idx_photos_event ON photos(event);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);