-- Tides Girls Water Polo Platform - Complete Database Schema DDL
-- Generated: July 17, 2025
-- This file contains the complete database structure including all tables, constraints, and indexes

-- Drop all existing tables (uncomment if needed for clean rebuild)
-- DROP TABLE IF EXISTS access_requests CASCADE;
-- DROP TABLE IF EXISTS hashtags CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS photos CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- SESSIONS TABLE (Required for Replit Auth)
-- =============================================================================

CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Index for session expiration cleanup
CREATE INDEX idx_session_expire ON sessions USING btree (expire);

-- =============================================================================
-- USERS TABLE (Required for Replit Auth with Role-Based Access Control)
-- =============================================================================

CREATE TABLE users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,  -- Replit user ID
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'guest'::character varying,  -- administrator, editor, contributor, viewer, guest
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =============================================================================
-- EVENTS TABLE (Team Calendar Events)
-- =============================================================================

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    location TEXT,
    category TEXT NOT NULL DEFAULT 'games'::text,  -- games, team events, practice, training, team meetings, award ceremonies
    schedule_food TEXT NOT NULL DEFAULT 'false'::text,  -- true/false as text for consistency
    meal_coordinator_name TEXT,  -- meal coordinator name when food is scheduled
    meal_coordinator_email TEXT,  -- meal coordinator email when food is scheduled
    meal_coordinator_phone TEXT,  -- meal coordinator phone when food is scheduled
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- MESSAGES TABLE (Tide Talk Chat System)
-- =============================================================================

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'general'::text,  -- general, announcements, sports, homework-help, events
    author_name TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_id TEXT NOT NULL DEFAULT ''::text,  -- For edit/delete permissions
    author_color TEXT NOT NULL,
    inappropriate TEXT NOT NULL DEFAULT 'false'::text,  -- Moderation flag
    edited_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- PHOTOS TABLE (Tide Memories Photo Gallery)
-- =============================================================================

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    event TEXT,  -- Associated event name
    uploaded_by TEXT NOT NULL,  -- Uploader name for display
    uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- PROFILES TABLE (Team Member Profiles)
-- =============================================================================

CREATE TABLE profiles (
    id VARCHAR PRIMARY KEY REFERENCES users(id),
    name VARCHAR NOT NULL,
    "phoneNumber" VARCHAR,
    "emailAddress" VARCHAR NOT NULL,
    "profilePhoto" VARCHAR,
    "teamRole" TEXT DEFAULT 'player'::text,  -- player, coach, parent
    "playerNumber" TEXT,  -- Only for players
    "playerName" TEXT,    -- Only for players
    parentphonenumber TEXT,  -- Only for players
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =============================================================================
-- HASHTAGS TABLE (Chat Hashtag Management)
-- =============================================================================

CREATE TABLE hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    is_active TEXT NOT NULL DEFAULT 'true'::text,  -- true/false as text
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =============================================================================
-- ACCESS_REQUESTS TABLE (Guest Access Request System)
-- =============================================================================

CREATE TABLE access_requests (
    id SERIAL PRIMARY KEY,
    requester_name VARCHAR NOT NULL,
    requester_email VARCHAR NOT NULL,
    relationship TEXT NOT NULL,  -- Relationship to team/player
    reason TEXT NOT NULL,        -- Why they want access
    disposition VARCHAR(20) DEFAULT 'pending'::character varying,  -- pending, granted, denied
    processed_by VARCHAR,        -- Admin who processed the request
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITHOUT TIME ZONE
);

-- =============================================================================
-- SAMPLE DATA INSERTS (Initial Setup)
-- =============================================================================

-- Insert sample hashtags
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
-- COMMENTS AND NOTES
-- =============================================================================

-- Role-Based Access Control (RBAC) System:
-- - Administrator: Full access to all features including user management
-- - Editor: Can create/edit events and messages, upload photos
-- - Contributor: Can create events and messages, upload photos
-- - Viewer: Read-only access to all content
-- - Guest: No access to platform content (must request access)

-- Permission Matrix:
-- Feature               | Admin | Editor | Contributor | Viewer | Guest |
-- ---------------------|-------|--------|-------------|--------|-------|
-- Create Events        |   ✓   |   ✓    |      ✓      |   ✗    |   ✗   |
-- Edit Events          |   ✓   |   ✓    |      ✗      |   ✗    |   ✗   |
-- Delete Events        |   ✓   |   ✗    |      ✗      |   ✗    |   ✗   |
-- View Events          |   ✓   |   ✓    |      ✓      |   ✓    |   ✗   |
-- Create Messages      |   ✓   |   ✓    |      ✓      |   ✗    |   ✗   |
-- Edit Messages        |   ✓   |   ✗    |      ✗      |   ✗    |   ✗   |
-- Delete Messages      |   ✓   |   ✗    |      ✗      |   ✗    |   ✗   |
-- Upload Photos        |   ✓   |   ✓    |      ✓      |   ✗    |   ✗   |
-- Delete Photos        |   ✓   |   ✗    |      ✗      |   ✗    |   ✗   |
-- View Photos          |   ✓   |   ✓    |      ✓      |   ✓    |   ✗   |
-- Manage Users         |   ✓   |   ✗    |      ✗      |   ✗    |   ✗   |

-- Security Features:
-- - Session-based authentication through Replit Auth
-- - Role-based permission checks on all API endpoints
-- - Photo deletion limited to administrators and original uploaders
-- - Guest access request system with admin approval workflow
-- - Message editing limited to original authors and administrators

-- Data Integrity:
-- - Foreign key constraints maintain referential integrity
-- - Unique constraints prevent duplicate users and hashtags
-- - Default values ensure consistent data state
-- - Timestamps track creation and modification times
-- - File metadata tracks photo uploads and storage