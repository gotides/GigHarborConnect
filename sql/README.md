# SQL Directory - Tides Girls Water Polo Platform

This directory contains comprehensive SQL schema files for the Tides Girls Water Polo application database.

## Files Overview

### Core Schema Files (NEW - July 17, 2025)
- `00_complete_schema_ddl.sql` - **Complete database schema** with all tables, constraints, indexes, and documentation
- `01_tables_only.sql` - **Tables only** - Basic table creation statements without indexes or sample data  
- `02_indexes_and_constraints.sql` - **Indexes and constraints** - Performance indexes, foreign keys, and data validation
- `03_sample_data.sql` - **Sample data** - Initial hashtags and example data for testing
- `04_maintenance_and_views.sql` - **Maintenance utilities** - Views, functions, and administrative tools

### Legacy Files (Deprecated)
- `00_full_schema.sql` - Legacy complete schema file
- `01_sessions.sql` - Legacy session table file
- `01_updated_schema.sql` - Legacy updated schema file
- `02_users.sql` - Legacy user table file
- `03_events.sql` - Legacy events table file
- `04_messages.sql` - Legacy messages table file
- `05_photos.sql` - Legacy photos table file

## Quick Setup

### Option 1: Complete Setup (Recommended)
```sql
-- Run the complete schema file for full setup
\i 00_complete_schema_ddl.sql
```

### Option 2: Incremental Setup
```sql
-- Run files in order for step-by-step setup
\i 01_tables_only.sql
\i 02_indexes_and_constraints.sql
\i 03_sample_data.sql
\i 04_maintenance_and_views.sql
```

## Database Schema Overview

### Core Tables
- **`sessions`** - User session management (Replit Auth)
- **`users`** - User accounts with role-based access control
- **`events`** - Team calendar events and activities
- **`messages`** - Multi-channel chat system (Tide Talk)
- **`photos`** - Photo gallery with metadata (Tide Memories)
- **`profiles`** - Team member profiles with roles
- **`hashtags`** - Chat hashtag management system
- **`access_requests`** - Guest access request workflow

### Role-Based Access Control (RBAC)

| Role | Create Events | Edit Events | Upload Photos | Delete Photos | Manage Users |
|------|---------------|-------------|---------------|---------------|--------------|
| **Administrator** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Editor** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Contributor** | ✓ | ✗ | ✓ | ✗ | ✗ |
| **Viewer** | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Guest** | ✗ | ✗ | ✗ | ✗ | ✗ |

### Key Features
- **Authentication**: Replit OAuth integration with session management
- **Permissions**: Granular role-based access control system  
- **Photo Management**: Upload, display, and deletion with permission checks
- **Chat System**: Multi-channel messaging with hashtag organization
- **Event Calendar**: Team schedule management with categories
- **Guest Access**: Request and approval workflow for external users
- **Data Integrity**: Foreign key constraints and validation rules
- **Performance**: Optimized indexes for common query patterns

## Maintenance

### Regular Maintenance Tasks
```sql
-- Clean up expired sessions
SELECT cleanup_expired_sessions();

-- View database size summary  
SELECT * FROM get_database_size_summary();

-- Check recent activity
SELECT * FROM recent_activity LIMIT 20;

-- Archive old messages (optional)
SELECT archive_old_messages(365); -- Archive messages older than 1 year
```

### Useful Views
- `active_hashtags` - Active hashtags with usage statistics
- `recent_activity` - Recent team activity across all features
- `user_statistics` - User engagement metrics
- `pending_access_requests` - Guest access requests awaiting approval
- `monthly_activity_report` - Monthly usage statistics
- `channel_usage_stats` - Chat channel usage patterns

## Security Notes

- All sensitive operations require authentication
- Role-based permissions enforced at database and application levels
- Photo deletion limited to administrators and original uploaders
- Session data automatically expires and cleans up
- Foreign key constraints maintain data integrity
- Input validation through check constraints

## Last Updated
July 17, 2025 - Complete schema restructure with enhanced DDL files and maintenance utilities