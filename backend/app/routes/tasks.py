from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import Project, Task
from ..schemas import TaskCreate, TaskResponse


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/",
    response_model=TaskResponse,
)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    project = db.get(Project, task.project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    new_task = Task(
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get(
    "/",
    response_model=list[TaskResponse],
)
def get_tasks(
    db: Session = Depends(get_db),
):
    return db.query(Task).all()


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_task(
    task_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    project = db.get(Project, task_data.project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    task.project_id = task_data.project_id
    task.title = task_data.title
    task.description = task_data.description
    task.status = task_data.status
    task.priority = task_data.priority
    task.due_date = task_data.due_date

    db.commit()
    db.refresh(task)

    return task


@router.delete(
    "/{task_id}",
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }
