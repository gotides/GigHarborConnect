# Tides Hub - Tides Girls Water Polo Platform

## Overview

Tides Hub is a full-stack web application designed for the Tides Girls Water Polo team. It provides a centralized platform for managing team events, facilitating communication through chat channels, and sharing photos/memories. The application uses a modern tech stack with React frontend, Express backend, and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom Tides Girls Water Polo branding (navy, columbia blue, wave colors)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with development hot reload

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured JSON responses
- **File Handling**: Multer for photo uploads with file validation
- **Development**: Custom Vite middleware integration for seamless development experience

### Data Storage
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas for runtime type validation
- **Storage**: PostgreSQL database with Drizzle ORM for persistent data

## Key Components

### 1. Event Management System
- Calendar view with monthly navigation
- Event creation, editing, and deletion
- Water polo-specific categories (Games, Team Events, Practice, Training, Team Meetings, Award Ceremonies)
- Date/time handling with proper timezone support
- Color-coded events by category with team-specific color scheme

### 2. Chat System ("Tide Talk")
- Multi-channel chat (general, announcements, sports, homework-help, events)
- Real-time-like experience with polling (3-second intervals)
- Author identification with colored avatars and initials
- Message persistence and history

### 3. Photo Gallery ("Memories")
- Drag-and-drop photo uploads
- Image validation (type and size limits)
- Photo organization by events
- Lightbox viewing experience
- Metadata tracking (title, description, uploader, timestamp)

### 4. User Interface
- Mobile-responsive design
- Tab-based navigation between features
- Water polo team-branded color scheme and styling
- Consistent component library usage
- Accessibility considerations with proper ARIA labels

## Data Flow

### Request Flow
1. Client makes API requests through React Query
2. Express server handles routing and validation
3. Storage layer (Drizzle ORM or in-memory) processes data operations
4. Response sent back with proper error handling
5. Client updates UI state through React Query cache

### File Upload Flow
1. Client selects/drops image files
2. Multer middleware validates file type and size
3. Files stored in local uploads directory
4. Metadata saved to database with file references
5. Client receives success confirmation and updates gallery

### Authentication Flow
- Currently uses session-based approach (prepared for future implementation)
- User identification through username/display name fields
- No complex authentication system in current implementation

## External Dependencies

### Core Dependencies
- **React Ecosystem**: react, react-dom, @tanstack/react-query
- **UI Library**: @radix-ui components, class-variance-authority
- **Styling**: tailwindcss, clsx
- **Backend**: express, multer, drizzle-orm
- **Database**: @neondatabase/serverless, pg
- **Validation**: zod, @hookform/resolvers
- **Build Tools**: vite, tsx, esbuild

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **Development Tools**: @replit/vite-plugin-runtime-error-modal for debugging
- **Path Resolution**: Configured aliases for clean imports (@/, @shared/, @assets/)

## Deployment Strategy

### Development Environment
- Vite dev server with Express backend integration
- Hot module replacement for frontend changes
- Automatic server restart on backend changes
- Environment variable configuration for database connection

### Production Build
- Frontend: Vite builds React app to static files
- Backend: esbuild bundles Express server with external packages
- Database: PostgreSQL deployment with connection pooling
- File Storage: Local file system (uploads directory)

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Build artifacts in `dist/` directory
- Static files served from `dist/public/`

## Changelog
- July 20, 2025: Important Dates Feature Migration to Tide Hub
  - ✓ Moved Important Dates feature from landing page to Tide Hub as new tab after memories
  - ✓ Added fourth tab "Important Dates" to authenticated user experience in Tides Hub
  - ✓ Restored simple features grid layout on landing page for non-authenticated users
  - ✓ Updated tab navigation to accommodate four tabs with responsive design
  - ✓ Maintained all Important Dates functionality: categorization, priority levels, and date display
  - ✓ Enhanced user experience by placing Important Dates within main application workflow
  - ✓ Added full administrator controls for Important Dates including add, edit, and delete functionality
  - ✓ Implemented chronological ordering with next upcoming date at top, removed past date greying
  - ✓ Created comprehensive API endpoints for Important Dates CRUD operations (POST, PUT, DELETE)
  - ✓ Built admin form interface with date picker, category selection, and priority levels
  - ✓ Fixed HTTP token error in API requests by correcting method parameter format

- July 17, 2025: Schedule Food Checkbox Implementation
  - ✓ Added persistent "schedule food" checkbox to create event dialog
  - ✓ Added schedule_food column to events table with default value "false"
  - ✓ Updated event form schema to include scheduleFood boolean field
  - ✓ Added checkbox component to event creation form with proper validation
  - ✓ Updated event detail modal to display food scheduled status with food emoji
  - ✓ Enhanced upcoming events display to show food scheduled indicator
  - ✓ All existing events default to no food scheduled to maintain data integrity
  
- July 17, 2025: Meal Coordinator Dialog Implementation
  - ✓ Added meal coordinator database columns (name, email, phone, location, address) to events table
  - ✓ Created MealCoordinatorDialog component with form validation
  - ✓ Implemented dialog trigger when "schedule food" checkbox is clicked
  - ✓ Added form validation requiring meal coordinator info when food is scheduled
  - ✓ Enhanced event detail modal to display meal coordinator contact information
  - ✓ Added coordinator name display next to schedule food checkbox when set
  - ✓ Integrated proper data flow between checkbox, dialog, and form submission
  - ✓ Added location (required) and address (optional) fields to meal coordinator information
  - ✓ Updated all validation to require location when food is scheduled
  - ✓ Added "Signup to Provide Food" button for events with scheduled food
  - ✓ Created FoodSignupDialog with meal coordinator info display and food coordination notes
  - ✓ Implemented admin-only editing of food coordination notes with proper permissions
  - ✓ Added food_coordination_notes column to database schema and updated all DDL files
  - ✓ Fixed Food Coordination Notes dialog to properly load existing notes from database
  - ✓ Added automatic announcement system for events with scheduled food
  - ✓ System posts #announcements messages when food is scheduled for events
  - ✓ Announcements include event details, meal coordinator info, and food signup encouragement
  
- July 17, 2025: Photo Delete Functionality Implementation
  - ✓ Added photo deletion functionality with proper permission checks for administrators and photo uploaders
  - ✓ Implemented confirmation dialog with "Delete Cannot be Undone" warning message
  - ✓ Added delete buttons to both photo gallery grid view and lightbox modal
  - ✓ Fixed API request method parameter order issue in delete mutations
  - ✓ Added proper error handling and loading states for delete operations
  - ✓ Ensured authentication checks prevent unauthorized photo deletions
  - ✓ Delete functionality works from both grid hover state and lightbox view
  
- July 17, 2025: Guest Access Request System and Permission Updates
  - ✓ Created complete guest access request system with database table and API endpoints
  - ✓ Built GuestAccessRequestForm component with name, email, relationship, and reason fields
  - ✓ Added access request management to admin panel with disposition controls (pending/granted/denied)
  - ✓ Integrated guest access form into CalendarView, ChatView, and PhotosView for restricted users
  - ✓ Added information icon with tooltip for viewing requester reasons in admin panel
  - ✓ Updated Viewer role permissions to remove ability to create events, messages, and upload photos
  - ✓ Enhanced Authentication Error Handling and Comprehensive Hashtag Management
  - ✓ Added better error handling for duplicate email constraint violations in authentication
  - ✓ Implemented user-friendly error messages when manual users try to sign in with Google/OAuth
  - ✓ Enhanced authentication callback with specific error handling and redirect logic
  - ✓ Added error alerts to landing and home pages with URL parameter parsing
  - ✓ Improved admin user creation endpoint with detailed error messages for email conflicts
  - ✓ Created comprehensive hashtag management system for administrators
  - ✓ Added hashtags database table with proper schema and seeded initial data
  - ✓ Implemented complete admin UI for hashtag CRUD operations (add/edit/delete/toggle)
  - ✓ Added hashtag filtering system with activation/deactivation functionality
  - ✓ Built hashtag API endpoints with full authentication and permission checks
  - ✓ Enhanced error handling throughout admin panel with specific messaging

- July 18, 2025: Direct Messages System for Administrators
  - ✓ Added Direct Messages tab to Application Management page for administrators
  - ✓ Created AdminMessages component to display messages tagged with #administrator
  - ✓ Added API endpoint to fetch admin messages with proper permission checks
  - ✓ Added #administrator hashtag to database for secure communication with team leadership
  - ✓ Implemented content hiding feature for #administrator messages in Tide Talk
  - ✓ Messages tagged with #administrator show "Message Sent" to non-administrators
  - ✓ Full message content remains visible to administrators in both Tide Talk and Direct Messages tab
  - ✓ Added visual indicators and proper styling for administrator messages (red accents, lock icon)
  - ✓ Implemented channel filtering and message sorting in admin messages view

- July 14, 2025: Added Rotating Photo Display to Events Page and Enhanced Photo Upload Security
  - ✓ Created PhotoCarousel component with automatic 3-second photo rotation
  - ✓ Integrated rotating photo display into Events page above calendar grid with gradient background
  - ✓ Added photo overlay with title, event name, and navigation indicators
  - ✓ Displays photo counter (1/5, 2/5, etc.) and smooth transitions between photos
  - ✓ Responsive layout - side-by-side on large screens, stacked on mobile devices
  - ✓ Handles empty states and loading states gracefully with appropriate messages
  - ✓ Uses actual photos from Team Memories section for authentic team content
  - ✓ Fixed database column naming for parent phone number field in profiles
  - ✓ Implemented authentication-required photo uploads (Admin/Editor/Contributor only)
  - ✓ Added uploader name display for each photo in gallery and lightbox views
  - ✓ Updated photo upload API to automatically track authenticated uploader names
  - ✓ Enhanced UI to show permission-based upload access with appropriate messaging

- July 09, 2025: Enhanced Profile Management with Team Roles and Recent Announcements Feature
  - ✓ Updated SQL schema documentation with complete DDL export from database
  - ✓ Added profiles table with team roles (player, coach, parent/relative)
  - ✓ Added message editing functionality with author_id and edited_at columns
  - ✓ Updated all indexes and constraints to match current database structure
  - ✓ Created comprehensive schema file with all tables, foreign keys, and sample data
  - ✓ Recent Announcements feature automatically removes #announcements hashtag from display text
  - ✓ Successfully debugged and fixed profile saving functionality after extensive troubleshooting
  - ✓ Resolved database schema mismatch between snake_case and camelCase column naming
  - ✓ Updated profiles table structure to match TypeScript schema definitions
  - ✓ Fixed profile photo upload and storage system with proper file handling
  - ✓ Added API endpoint to serve profile photos with correct content types
  - ✓ Profile creation, editing, and photo display now working correctly for team members
  - ✓ Added team role selection system: Player, Coach, Parent/Relative
  - ✓ Implemented conditional player-specific fields: Player Number and Player Name
  - ✓ Enhanced profile display with role badges and player information visualization
  - ✓ Updated database schema with new teamRole, playerNumber, and playerName columns
  - ✓ Implemented Recent Announcements feature on Events page
  - ✓ Added API endpoint to fetch messages tagged with #announcements from last 30 days
  - ✓ Created visual announcements panel with blue styling, megaphone icon, and author details
  - ✓ Displays timestamp using relative time format (e.g. "2 hours ago")
  - ✓ Added loading states and empty state handling for announcements
  - ✓ Complete enhanced profile management and announcements workflow fully functional

- July 08, 2025: Administrator User Management System Completion
  - ✓ Fixed critical bugs in user management API requests (method signature issues)
  - ✓ Resolved add user form submission errors preventing user creation
  - ✓ Fixed update user role functionality with proper API request handling
  - ✓ Successfully tested complete user management workflow: create, view, update roles, delete
  - ✓ Verified all CRUD operations work correctly with comprehensive permission checks
  - ✓ Implemented safety features: prevent self-deletion, protect last administrator
  - ✓ Cleaned up debug logging for production readiness
  - ✓ Administrator page fully functional for comprehensive team user management

- July 07, 2025: Authentication and Role-Based Access Control Implementation
  - ✓ Integrated Replit Auth with Google OAuth for secure user authentication
  - ✓ Implemented comprehensive role-based access control system
  - ✓ Added five user roles: Administrator, Editor, Contributor, Viewer, Guest
  - ✓ Created detailed permission matrix for feature access control
  - ✓ Added landing page for non-authenticated users
  - ✓ Updated database schema for Replit Auth compatibility
  - ✓ Protected all API endpoints with authentication and permission checks
  - ✓ Added user profile display with role information and logout functionality
  - ✓ Added Instagram logo footer linking to team's official account
  - ✓ Enhanced water polo ball icon in Tide Talk header
  - ✓ Assigned administrator role to user ID 44503831 (Rob Nelson)
  - ✓ Assigned administrator role to user ID 44695004 (tides-admin ghhs)
  - ✓ Fixed chat permissions for administrators to allow message sending
  - ✓ Resolved message schema validation issues for authenticated user chat
  - ✓ Confirmed Editor and Contributor roles have message sending permissions
  - ✓ Updated role names to use capitalized format (Administrator, Editor, Contributor, Viewer, Guest)
  - ✓ Created comprehensive administrator page (/admin) for user management
  - ✓ Added full CRUD operations for user accounts (create, view, update roles, delete)
  - ✓ Implemented safety features: prevent self-deletion, protect last administrator
  - ✓ Added admin shield icon in navigation bar for administrator users

- July 05, 2025: Initial setup and comprehensive feature implementation
  - ✓ Built complete event calendar system with monthly navigation
  - ✓ Implemented multi-channel chat system "Tide Talk" with real-time polling
  - ✓ Created photo sharing gallery "Tide Memories" with drag & drop uploads
  - ✓ Applied Gig Harbor High School theming (navy, columbia blue, wave colors)
  - ✓ Added mobile-responsive design with tab navigation
  - ✓ Integrated PostgreSQL database for persistent data storage
  - ✓ Added official Gig Harbor High School logo to header
  - ✓ Cleared all test data - ready for team to add their own content
  - ✓ User confirmed application looks good and functions properly

## User Preferences

Preferred communication style: Simple, everyday language.
Git repository settings: Preferred commit author "gotides" with email "tidesgirlspolo@gmail.com" for project contributions.