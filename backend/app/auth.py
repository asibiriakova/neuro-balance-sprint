"""Password hashing and bearer-token authentication.

Passwords are hashed with PBKDF2-HMAC-SHA256 (stdlib `hashlib`, no extra
dependency) using a random per-password salt. Bearer tokens are opaque,
high-entropy strings (`secrets.token_urlsafe`) issued at register/login time
and held in the store's in-memory token table - not JWTs, despite the
spec's `bearerFormat: JWT` hint, which is documentation of intent rather
than a requirement this stage of the project needs to satisfy.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from typing import TYPE_CHECKING

from fastapi import Header, HTTPException, Request, status

if TYPE_CHECKING:
    from app.store import InMemoryStore, UserRecord

_PBKDF2_ITERATIONS = 260_000
_ALGORITHM = "sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt_hex, digest_hex = hashed.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return hmac.compare_digest(candidate, expected)


def get_store(request: Request) -> InMemoryStore:
    """FastAPI dependency exposing the app's single in-memory store."""
    return request.app.state.store


def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
) -> UserRecord:
    """FastAPI dependency enforcing the spec's `bearerAuth` security scheme.

    Raises the spec's documented 401 (`Unauthorized`) when the header is
    missing, malformed, or names an unknown/expired token.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid bearer token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization:
        raise unauthorized
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized

    store = get_store(request)
    user_id = store.user_id_for_token(token)
    user = store.get_user_by_id(user_id) if user_id else None
    if user is None:
        raise unauthorized
    return user
