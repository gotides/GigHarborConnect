-- Tides Girls Water Polo Platform - Tables Only DDL
-- Generated: July 17, 2025
-- This file contains only table creation statements without indexes or sample data

-- Sessions table for Replit Auth
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Users table with role-based access control
CREATE TABLE users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'guest'::character varying,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Events table for team calendar
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    location TEXT,
    category TEXT NOT NULL DEFAULT 'games'::text,
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table for chat system
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'general'::text,
    author_name TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_id TEXT NOT NULL DEFAULT ''::text,
    author_color TEXT NOT NULL,
    inappropriate TEXT NOT NULL DEFAULT 'false'::text,
    edited_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Photos table for memory gallery
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
    uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table for team member information
CREATE TABLE profiles (
    id VARCHAR PRIMARY KEY REFERENCES users(id),
    name VARCHAR NOT NULL,
    "phoneNumber" VARCHAR,
    "emailAddress" VARCHAR NOT NULL,
    "profilePhoto" VARCHAR,
    "teamRole" TEXT DEFAULT 'player'::text,
    "playerNumber" TEXT,
    "playerName" TEXT,
    parentphonenumber TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Hashtags table for chat organization
CREATE TABLE hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    is_active TEXT NOT NULL DEFAULT 'true'::text,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Access requests table for guest access management
CREATE TABLE access_requests (
    id SERIAL PRIMARY KEY,
    requester_name VARCHAR NOT NULL,
    requester_email VARCHAR NOT NULL,
    relationship TEXT NOT NULL,
    reason TEXT NOT NULL,
    disposition VARCHAR(20) DEFAULT 'pending'::character varying,
    processed_by VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITHOUT TIME ZONE
);