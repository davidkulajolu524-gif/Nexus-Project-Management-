from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine, ensure_schema
from .auth import SESSION_COOKIE
from .models import AuthSession
from . import models
from .routes.projects import router as projects_router
from .routes.tasks import router as tasks_router
from .routes.auth import router as auth_router
from .routes.workspace import router as workspace_router


Base.metadata.create_all(bind=engine)
ensure_schema()


app = FastAPI(
    title="Nexus",
    description="Interactive project management platform",
    version="1.0.0",
)


app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(auth_router)
app.include_router(workspace_router)


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"


app.mount(
    "/css",
    StaticFiles(directory=FRONTEND_DIR / "css"),
    name="css",
)


app.mount(
    "/js",
    StaticFiles(directory=FRONTEND_DIR / "js"),
    name="js",
)


@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/dashboard")
def dashboard(request: Request):
    if not request.cookies.get(SESSION_COOKIE):
        return RedirectResponse("/auth")
    return FileResponse(FRONTEND_DIR / "dashboard.html")


@app.get("/project/{project_id}")
def project_page(project_id: int, request: Request):
    if not request.cookies.get(SESSION_COOKIE):
        invite = request.query_params.get("invite")
        destination = f"/project/{project_id}"
        if invite:
            destination += f"?invite={invite}"
        return RedirectResponse(f"/auth?next={destination}")
    return FileResponse(FRONTEND_DIR / "project.html")


@app.get("/auth")
def auth_page():
    return FileResponse(FRONTEND_DIR / "auth.html")


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
