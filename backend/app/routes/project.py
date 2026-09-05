from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Task
from ..schemas import ProjectCreate, ProjectResponse


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# =========================================================
# CREATE PROJECT
# =========================================================

@router.post(
    "/",
    response_model=ProjectResponse,
)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    new_project = Project(
        name=project.name,
        description=project.description,
        status=project.status,
        color=project.color,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


# =========================================================
# GET ALL PROJECTS
# =========================================================

@router.get(
    "/",
    response_model=list[ProjectResponse],
)
def get_projects(
    db: Session = Depends(get_db),
):
    return db.query(Project).all()


# =========================================================
# GET SINGLE PROJECT
# =========================================================

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


# =========================================================
# UPDATE PROJECT
# =========================================================

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    project.name = project_data.name
    project.description = project_data.description
    project.status = project_data.status
    project.color = project_data.color

    db.commit()
    db.refresh(project)

    return project


# =========================================================
# DELETE PROJECT
# =========================================================

@router.delete(
    "/{project_id}",
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    # -----------------------------------------------------
    # Delete all tasks belonging to this project first.
    # Tasks reference the project through project_id.
    # -----------------------------------------------------

    db.query(Task).filter(
        Task.project_id == project_id
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------------------
    # Now delete the project itself.
    # -----------------------------------------------------

    db.delete(project)

    db.commit()

    return {
        "message": "Project deleted successfully"
    }
