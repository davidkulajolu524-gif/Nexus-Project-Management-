# Nexus

Nexus is a small project-management workspace with projects, tasks, deadlines, task filtering, progress summaries, and account authentication.

## Run locally

Requirements: Python 3.12+ and [`uv`](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Open [http://localhost:8001](http://localhost:8001). The API documentation is available at [http://localhost:8001/docs](http://localhost:8001/docs).

Project invitations use SMTP. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, and `SMTP_PASSWORD` before starting the server. Set `APP_BASE_URL` when the app is not running at `http://localhost:8001`.

## Included features

- Account creation and sign-in
- HTTP-only server sessions
- Sign out and switch accounts
- Password reset for local development
- Client and server password-strength validation
- Project and task CRUD
- Task status, priority, search, and deadline filters
- Responsive dashboard and project views

## Project layout

- `backend/app`: FastAPI application, database models, routes, and authentication
- `frontend`: static pages, styles, and browser-side behavior

The SQLite database is created locally at `backend/nexus.db` and is intentionally ignored by Git.

## Before pushing

```bash
git status
git add .
git commit -m "Build Nexus project management workspace"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your GitHub repository URL. Never commit passwords, tokens, or local database files.