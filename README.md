# Sticky Notes App

Web app for user-scoped sticky notes with React, FastAPI, JSON persistence, and Docker deployment.

## Features

- Login page first
- Forced password change on first login
- Dashboard with:
  - Search notes
  - Create notes
  - Test-user-only create user view
- JSON file persistence
- Docker Compose deployment

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI
- Auth: JWT bearer tokens
- Persistence: JSON file
- Deployment: Docker Compose

## Project Structure

```text
backend/
  main.py
  requirements.txt
  Dockerfile
  data/db.json
frontend/
  src/
  package.json
  vite.config.js
  Dockerfile
  nginx.conf
docker-compose.yml
REQUIREMENTS.md
```

## Requirements

See `REQUIREMENTS.md` for the full spec.

## Default User

- Username: `test`
- Password: `test123`
- First login requires a password change

## Local Development

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Docker Run

```powershell
docker compose up --build
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:8000/health
```

## API Endpoints

- `POST /api/login`
- `GET /api/me`
- `POST /api/change-password`
- `POST /api/users` (test user only)
- `POST /api/notes`
- `GET /api/notes?search=...`

## Notes

- New users created by `test` are forced to change their password on first login.
- Notes are scoped to the logged-in user.
- The backend persists data in `backend/data/db.json`.
