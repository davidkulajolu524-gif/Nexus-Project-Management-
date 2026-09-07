from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from .passwords import validate_password_strength


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(
        min_length=12,
        max_length=128,
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class ResetPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(
        min_length=12,
        max_length=128,
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class ProjectCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str | None = None

    status: str = "active"

    color: str = "#4f46e5"


class ProjectResponse(BaseModel):
    id: int

    name: str

    description: str | None

    status: str

    color: str

    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class ProjectMemberCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    role: str = Field(default="member", min_length=1, max_length=30)


class ProjectInvitationCreate(ProjectMemberCreate):
    pass


class ProjectMemberResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    name: str
    email: str
    role: str
    created_at: datetime


class ProjectFileResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    content_type: str | None
    size: int
    uploaded_by: int
    created_at: datetime


class TaskCreate(BaseModel):
    project_id: int

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    status: str = "todo"

    priority: str = "medium"

    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int

    project_id: int

    title: str

    description: str | None

    status: str

    priority: str

    due_date: date | None

    created_at: datetime

    model_config = {
        "from_attributes": True
    }
