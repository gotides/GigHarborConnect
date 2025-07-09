-- Tides Hub Database Schema
-- Updated: July 09, 2025
-- This is the complete DDL for the Tides Girls Water Polo platform

-- Drop existing tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS photos CASCADE; 
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS events_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS messages_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS photos_id_seq START 1;

-- Create users table (main authentication table for Replit Auth)
CREATE TABLE users (
    id character varying(255) NOT NULL PRIMARY KEY,
    email character varying(255) UNIQUE,
    first_name character varying(255),
    last_name character varying(255),
    profile_image_url character varying(255),
    role character varying(50) NOT NULL DEFAULT 'guest',
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Create sessions table (required for Replit Auth session storage)
CREATE TABLE sessions (
    sid character varying NOT NULL PRIMARY KEY,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);

-- Create events table
CREATE TABLE events (
    id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass) PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    location text,
    category text NOT NULL DEFAULT 'games',
    created_by character varying(255) REFERENCES users(id),
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Create messages table (with edit/delete functionality)
CREATE TABLE messages (
    id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass) PRIMARY KEY,
    content text NOT NULL,
    channel text NOT NULL DEFAULT 'general',
    author_name text NOT NULL,
    author_initials text NOT NULL,
    author_id text NOT NULL DEFAULT '',
    author_color text NOT NULL,
    inappropriate text NOT NULL DEFAULT 'false',
    edited_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Create photos table
CREATE TABLE photos (
    id integer NOT NULL DEFAULT nextval('photos_id_seq'::regclass) PRIMARY KEY,
    title text NOT NULL,
    description text,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    event text,
    uploaded_by text NOT NULL,
    uploaded_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Create profiles table (with team roles and player information)
CREATE TABLE profiles (
    id character varying NOT NULL PRIMARY KEY REFERENCES users(id),
    name character varying NOT NULL,
    phoneNumber character varying,
    emailAddress character varying NOT NULL,
    profilePhoto character varying,
    teamRole text DEFAULT 'player',
    playerNumber text,
    playerName text,
    createdAt timestamp without time zone DEFAULT now(),
    updatedAt timestamp without time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);

-- Insert default data
INSERT INTO users (id, email, first_name, last_name, role) VALUES 
('44503831', 'robn96793@gmail.com', 'Rob', 'Nelson', 'Administrator'),
('44695004', 'tidesgirlspolo@gmail.com', 'tides-admin', 'ghhs', 'Administrator')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();