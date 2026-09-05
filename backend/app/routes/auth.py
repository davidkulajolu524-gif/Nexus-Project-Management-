from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..auth import (
    SESSION_COOKIE,
    create_session,
    get_current_user,
    hash_password,
    normalize_email,
    set_session_cookie,
    verify_password,
)
from ..database import get_db
from ..models import AuthSession, User
from ..schemas import (
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(
    data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalize_email(data.email)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    set_session_cookie(response, create_session(user, db))
    return user


@router.post("/login", response_model=UserResponse)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == normalize_email(data.email)).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")

    set_session_cookie(response, create_session(user, db))
    return user


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        db.query(AuthSession).filter(AuthSession.token == token).delete()
        db.commit()
    response.delete_cookie(SESSION_COOKIE)
    return {"message": "Signed out successfully."}


@router.post("/forgot-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == normalize_email(data.email)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="No account was found for that email.")

    user.password_hash = hash_password(data.password)
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
    db.commit()
    return {"message": "Password updated. You can now sign in."}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user