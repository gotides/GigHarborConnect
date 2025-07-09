# Tides Hub Database Schema

This directory contains the complete Database Definition Language (DDL) files for the Tides Hub application - the Gig Harbor High School Water Polo team management platform.

## Files Overview

### Complete Schema
- **`00_full_schema.sql`** - Complete database schema with all tables, constraints, and indexes

### Individual Table DDL Files
- **`01_sessions.sql`** - Authentication session storage (Replit Auth)
- **`02_users.sql`** - User management with role-based access control
- **`03_events.sql`** - Calendar events and team activities
- **`04_messages.sql`** - Tide Talk chat system
- **`05_photos.sql`** - Tide Memories photo gallery

## Database Tables

### 1. Sessions
- **Purpose**: Stores authentication sessions for Replit Auth
- **Key Features**: Session expiration management, JSONB storage
- **Required**: Yes (for authentication)

### 2. Users
- **Purpose**: User accounts with role-based permissions
- **Roles**: Administrator, Editor, Contributor, Viewer, Guest
- **Key Features**: Replit ID integration, role-based access control

### 3. Events
- **Purpose**: Team calendar events (games, practices, meetings)
- **Categories**: games, team-events, practice, training, team-meetings, award-ceremonies
- **Key Features**: Date/time scheduling, location tracking, user attribution

### 4. Messages
- **Purpose**: Multi-channel chat system (Tide Talk)
- **Channels**: general, announcements, sports, homework-help, events
- **Key Features**: Author tracking, moderation flags, channel organization

### 5. Photos
- **Purpose**: Photo sharing gallery (Tide Memories)
- **Key Features**: File metadata, event association, upload tracking
- **Constraints**: Image file types only, 10MB size limit

## Deployment Instructions

### Using Full Schema
```sql
-- Deploy complete schema at once
\i 00_full_schema.sql
```

### Using Individual Files (Recommended Order)
```sql
-- Deploy tables in dependency order
\i 01_sessions.sql
\i 02_users.sql
\i 03_events.sql
\i 04_messages.sql
\i 05_photos.sql
```

## Role-Based Access Control

The application implements a comprehensive permission system:

- **Administrator**: Full access to all features and user management
- **Editor**: Can create/edit events, send messages, upload photos
- **Contributor**: Can create events, send messages, upload photos
- **Viewer**: Can view content and send messages only
- **Guest**: No access (requires authentication)

## Constraints and Business Rules

- Valid email addresses for users
- Event categories must be from predefined list
- Message channels must be from predefined list
- Photo files must be valid image types (JPEG, PNG, GIF, WebP)
- Maximum photo size of 10MB
- Session expiration management for security

## Indexes

Optimized for common query patterns:
- Event date range queries
- Message channel and timestamp queries
- Photo upload and event association queries
- Session expiration cleanup

---

*Generated for Tides Hub - Gig Harbor High School Water Polo Team Platform*
*Last Updated: July 2025*