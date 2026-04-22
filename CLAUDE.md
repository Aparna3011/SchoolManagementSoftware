# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a School Management System built as an Electron desktop application with React frontend and SQLite database. The application manages student registrations, fee payments, attendance tracking, and various administrative functions for schools.

## Architecture

The application follows a client-server-like architecture within Electron:

- **Frontend**: React with Vite (located in `src/`)
- **Backend**: Electron main process (located in `electron/`)
- **Database**: SQLite with better-sqlite3
- **IPC Communication**: Electron's IPC system connects frontend to backend

### Key Directories

- `electron/`: Backend logic, database models, and IPC controllers
- `src/`: Frontend React components and pages
- `electron/database/migrations/`: Database schema migrations

### Data Flow

1. Frontend calls `window.api.<domain>.<method>()` (defined in `electron/preload.js`)
2. IPC routes to handler in `electron/controllers/<domain>Controller.js`
3. Controller interacts with model in `electron/models/<domain>Model.js`
4. Model performs database operations using better-sqlite3

## Development Commands

### Starting Development Server

```bash
npm run dev
```

This command runs both the Vite development server (port 5173) and the Electron app concurrently.

### Building for Production

```bash
npm run build
```

Builds the React frontend with Vite and packages the Electron app with electron-builder.

### Running Individual Parts

- Start only Vite dev server: `npm run dev:vite`
- Start only Electron: `npm run dev:electron`

## Database Structure

The database uses migrations for schema evolution. Key tables include:

- `Company_Profile`: School information
- `Academic_Years`: Academic year definitions
- `Classes_Master`: Class definitions
- `Students_Master`: Student information
- `Student_Enrollments`: Yearly student enrollments
- `Payments`: Fee payment records
- `Attendance`: Daily attendance records
- `Weekly_Schedule`: Working days schedule
- `Holiday_Calendar`: Defined holidays

## Adding New Features

1. Create new migration file in `electron/database/migrations/` with incrementing version number
2. Add controller in `electron/controllers/`
3. Add model in `electron/models/`
4. Register IPC handlers in `electron/preload.js`
5. Create frontend components in `src/`

## Testing Changes

During development, use `npm run dev` to run the application with hot reloading for both frontend and backend changes.