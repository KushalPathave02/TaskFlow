# TaskFlow

TaskFlow is a full-stack task and project management application built with Next.js on the frontend and NestJS + PostgreSQL on the backend. It combines project workspaces, task tracking, subtasks, search/filtering, authentication, and a polished dashboard UI into a single workflow-focused experience.

## Overview

The application includes:

- Guest login and Google OAuth-ready authentication flow
- Project-based task management
- Task list and board style views
- Subtask creation, completion toggling, and deletion
- Project detail view with task summaries and counts
- Search and filter controls
- Light and dark theme support
- Persistent local UI state with backend-ready API structure

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons

### Backend
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT auth support
- Google identity verification integration

## Current Features

- Login screen with guest access and Google login integration path
- Sidebar-based app shell with profile, theme, and logout controls
- Dashboard with task metrics and quick task creation flows
- Task add, edit, delete, search, and filtering logic
- Project creation and project detail workspace
- Project-linked tasks and task counts by status
- Subtask management inside project tasks
- Project action menu with info/detail flow
- Responsive UI for desktop workspaces

## Project Structure

```text
task-management-system/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── docs/
│   └── part-2-product-understanding.md
├── .gitignore
├── README.md
└── package-lock.json
```

## Local Setup

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

Create a backend environment file:

```bash
cd backend
cp .env.example .env
```

Example content:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=task_management
DB_SSL=false
JWT_SECRET=task-management-secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Start PostgreSQL locally

Use your local Postgres instance or a Docker-based setup if available.

### 4. Run the applications

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Then open:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Authentication

The app supports a dual-login approach:

- Guest login using a local session token and persisted user profile
- Google login flow integrated with backend verification using Google identity credentials

The frontend checks for an active session and redirects unauthenticated users appropriately.

## Data Model

The app manages:

- Users
- Projects
- Tasks
- Subtasks

Project and task data are stored in local UI state and are structured for backend persistence through the NestJS + TypeORM layer.

## API Notes

The backend is organized around an auth module and core task/project resource patterns. Typical endpoints include:

```http
POST /api/auth/google
POST /api/auth/guest
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

The exact route structure can be expanded as the database layer and admin flows mature.

## Development Notes

This project is designed as a functional task workflow with a strong UI/UX focus. The frontend is intentionally project-aware, where task creation and project detail views work together to give a clear workspace feel rather than a generic one-page task dashboard.

## Deployment

The project is ready for GitHub-based repository hosting and can be deployed in a standard full-stack setup:

1. Push the repo to GitHub
2. Deploy the frontend to Vercel or Netlify
3. Deploy the backend to Render, Railway, or another Node.js-compatible platform
4. Update the frontend API base URL to the hosted backend URL

## Screenshots

Add screenshots of the login flow, dashboard, projects dashboard, and project detail workspace after running the app locally.

## Repository

GitHub repository: https://github.com/KushalPathave02/TaskFlow.git
