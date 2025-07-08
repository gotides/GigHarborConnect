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
- July 08, 2025: Administrator User Management System Completion
  - ✓ Fixed critical bug in add user functionality (API request method signature issue)
  - ✓ Resolved form submission errors preventing user creation
  - ✓ Successfully tested full user management workflow: create, view, update roles, delete
  - ✓ Cleaned up debug logging for production readiness
  - ✓ Verified all CRUD operations work correctly with proper permission checks
  - ✓ Administrator page now fully functional for team user management

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