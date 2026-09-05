import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import AuthSession, User


SESSION_COOKIE = "nexus_session"
SESSION_LENGTH = timedelta(days=7)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        260_000,
    )
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        expected = hash_password(password, bytes.fromhex(salt_hex))
        return hmac.compare_digest(expected, f"{salt_hex}${digest_hex}")
    except (ValueError, TypeError):
        return False


def create_session(user: User, db: Session) -> str:
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            token=token,
            user_id=user.id,
            expires_at=datetime.utcnow() + SESSION_LENGTH,
        )
    )
    db.commit()
    return token


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(SESSION_LENGTH.total_seconds()),
        httponly=True,
        samesite="lax",
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    session = (
        db.query(AuthSession)
        .filter(AuthSession.token == token)
        .first()
        if token
        else None
    )

    if session is None or session.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    return user