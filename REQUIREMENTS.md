# Sticky Notes Web Application Requirements

## Overview

Create a web application for managing sticky notes by user. The application must start with a login page, require the first test user to update their password, and then show a dashboard with options to search existing notes or create new notes.

## Technology Stack

- Frontend: React with Vite
- Backend: Python FastAPI
- Development Proxy: Vite proxy for `/api` routes to FastAPI
- Persistence: JSON file database
- Deployment: Docker with Docker Compose

## Initial User

The application must create an initial test user.

- Username: `test`
- Initial password: `test123`
- The user must be required to update the password after first login.

## User Management Requirement

- Only the seeded `test` user can access a user-creation view.
- The `test` user can create additional users from the dashboard.
- Newly created users must log in with the credentials created by the `test` user.
- After the first login, newly created users must be forced to change their password before accessing the dashboard.
- The user-creation feature must not be visible to non-`test` users.

## Authentication Requirements

- The first screen must be a login page.
- Users must authenticate before accessing notes.
- After the initial test user logs in with the default password, the app must require a password update.
- The dashboard must not be accessible until the required password update is completed.
- Notes must be scoped to the authenticated user.
- User management actions must be scoped to the seeded `test` user.

## Dashboard Requirements

After login and password update, the user must see a dashboard with two cards:

1. Search Notes
2. Create Notes

## Notes Requirements

Users must be able to:

- Create sticky notes.
- Search notes they have created.
- View all notes by default in the search notes view.
- Open any note in a centered modal.
- Edit a note from the modal.
- Delete a note from the modal.
- Store note data persistently in a JSON file.

Each note should include:

- ID
- User ID
- Title
- Content
- Color
- Created date/time

## Backend Requirements

Use FastAPI to provide an API for:

- Login
- Get current user
- Change password
- Create note
- Search notes
- Update note
- Delete note

Suggested endpoints:

- `POST /api/login`
- `GET /api/me`
- `POST /api/change-password`
- `POST /api/notes`
- `GET /api/notes?search=...`
- `PUT /api/notes/{note_id}`
- `DELETE /api/notes/{note_id}`

## Frontend Requirements

Use React with Vite.

The frontend must include:

- Login page
- Password update page
- Dashboard page
- Search notes card and flow
- Create notes card and flow
- API calls through Vite proxy using `/api/...`

## Vite Proxy Requirement

Configure Vite so frontend requests to `/api` are proxied to:

```text
http://localhost:8000
```

## JSON Database Requirement

The database must be a JSON file, for example:

```text
backend/data/db.json
```

Suggested database structure:

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "test",
      "password_hash": "hashed-password",
      "must_change_password": true
    }
  ],
  "notes": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Example note",
      "content": "Note content",
      "color": "#fff7a8",
      "created_at": "2026-05-19T00:00:00Z"
    }
  ]
}
```

## Run Requirements

Backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Application URL:

```text
http://localhost:5173
```

## Docker Deployment Requirement

- The application must be deployable with Docker.
- Use `docker-compose` to start both the backend and frontend services.
- The backend must expose port `8000`.
- The frontend must expose port `5173`.
- The JSON database must persist through a mounted volume.
- The frontend container must proxy `/api` requests to the backend container.

Suggested Docker commands:

```powershell
docker compose up --build
```

Deployment URLs:

```text
http://localhost:5173
http://localhost:8000/health
```
