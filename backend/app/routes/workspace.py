from pathlib import Path
import hashlib
import os
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Project, ProjectFile, ProjectInvitation, ProjectMember, User
from ..schemas import (
    ProjectFileResponse,
    ProjectInvitationCreate,
    ProjectMemberCreate,
    ProjectMemberResponse,
)


router = APIRouter(
    prefix="/projects/{project_id}",
    tags=["Workspace"],
    dependencies=[Depends(get_current_user)],
)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024
INVITATION_LENGTH = timedelta(days=7)
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


def get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def send_invitation_email(recipient: str, project: Project, role: str, link: str):
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Set SMTP_HOST and SMTP_FROM first.",
        )

    message = EmailMessage()
    message["Subject"] = f"You are invited to join {project.name} on Nexus"
    message["From"] = os.getenv("SMTP_FROM", "nexus@localhost")
    message["To"] = recipient
    message.set_content(
        f"You have been invited to join the {project.name} project on Nexus as a {role}.\n\n"
        f"Join the project: {link}\n\n"
        "This invitation expires in 7 days."
    )

    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    use_ssl = os.getenv("SMTP_SSL", "true").lower() == "true" or smtp_port == 465
    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    with smtp_class(smtp_host, smtp_port, timeout=15) as smtp:
        if not use_ssl and os.getenv("SMTP_TLS", "true").lower() == "true":
            smtp.starttls()
        if smtp_user and smtp_password:
            smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)


@router.post("/members/invite")
def invite_member(
    project_id: int,
    invitation_data: ProjectInvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    email = invitation_data.email.strip().lower()
    role = invitation_data.role.strip().lower()
    token = uuid4().hex + uuid4().hex
    invitation = ProjectInvitation(
        project_id=project_id,
        email=email,
        role=role,
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=datetime.utcnow() + INVITATION_LENGTH,
    )
    db.add(invitation)
    db.commit()

    base_url = os.getenv("APP_BASE_URL", "http://localhost:8001").rstrip("/")
    link = f"{base_url}/project/{project_id}?invite={token}"
    try:
        send_invitation_email(email, project, role, link)
    except Exception:
        db.delete(invitation)
        db.commit()
        raise

    return {"message": f"Invitation sent to {email}", "email": email}


@router.post("/invitations/{token}/accept", response_model=ProjectMemberResponse)
def accept_invitation(
    project_id: int,
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    invitation = (
        db.query(ProjectInvitation)
        .filter(
            ProjectInvitation.project_id == project_id,
            ProjectInvitation.token_hash == token_hash,
            ProjectInvitation.accepted_at.is_(None),
        )
        .first()
    )
    if invitation is None or invitation.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invitation is invalid or expired")
    if current_user.email != invitation.email:
        raise HTTPException(status_code=403, detail="Sign in with the invited email address")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if member is None:
        member = ProjectMember(
            project_id=project_id,
            user_id=current_user.id,
            role=invitation.role,
        )
        db.add(member)
    invitation.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(member)
    return {
        "id": member.id,
        "project_id": project_id,
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": member.role,
        "created_at": member.created_at,
    }


@router.get("/members", response_model=list[ProjectMemberResponse])
def get_members(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    rows = (
        db.query(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.created_at)
        .all()
    )
    return [
        {
            "id": member.id,
            "project_id": member.project_id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": member.role,
            "created_at": member.created_at,
        }
        for member, user in rows
    ]


@router.post("/members", response_model=ProjectMemberResponse)
def add_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, db)
    user = (
        db.query(User)
        .filter(User.email == member_data.email.strip().lower())
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="No account exists for that email")

    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="That user is already a member")

    member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=member_data.role.strip().lower(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return {
        "id": member.id,
        "project_id": project_id,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": member.role,
        "created_at": member.created_at,
    }


@router.delete("/members/{member_id}")
def remove_member(project_id: int, member_id: int, db: Session = Depends(get_db)):
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.id == member_id,
            ProjectMember.project_id == project_id,
        )
        .first()
    )
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member removed"}


@router.get("/files", response_model=list[ProjectFileResponse])
def get_files(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    return (
        db.query(ProjectFile)
        .filter(ProjectFile.project_id == project_id)
        .order_by(ProjectFile.created_at.desc())
        .all()
    )


@router.post("/files", response_model=ProjectFileResponse)
async def upload_file(
    project_id: int,
    upload: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_project_or_404(project_id, db)
    content = await upload.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller")

    filename = Path(upload.filename or "untitled").name
    stored_name = f"{uuid4().hex}-{filename}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOADS_DIR / stored_name).write_bytes(content)

    project_file = ProjectFile(
        project_id=project_id,
        uploaded_by=current_user.id,
        filename=filename,
        stored_name=stored_name,
        content_type=upload.content_type,
        size=len(content),
    )
    db.add(project_file)
    db.commit()
    db.refresh(project_file)
    return project_file


@router.get("/files/{file_id}/download")
def download_file(project_id: int, file_id: int, db: Session = Depends(get_db)):
    project_file = (
        db.query(ProjectFile)
        .filter(
            ProjectFile.id == file_id,
            ProjectFile.project_id == project_id,
        )
        .first()
    )
    if project_file is None:
        raise HTTPException(status_code=404, detail="File not found")
    path = UPLOADS_DIR / project_file.stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Stored file not found")
    return FileResponse(path, filename=project_file.filename, media_type=project_file.content_type)


@router.delete("/files/{file_id}")
def delete_file(project_id: int, file_id: int, db: Session = Depends(get_db)):
    project_file = (
        db.query(ProjectFile)
        .filter(
            ProjectFile.id == file_id,
            ProjectFile.project_id == project_id,
        )
        .first()
    )
    if project_file is None:
        raise HTTPException(status_code=404, detail="File not found")
    path = UPLOADS_DIR / project_file.stored_name
    if path.is_file():
        path.unlink()
    db.delete(project_file)
    db.commit()
    return {"message": "File deleted"}
