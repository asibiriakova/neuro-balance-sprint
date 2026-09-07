"""Auth endpoints.

Not part of `openapi.yaml` (the spec assumes every request already carries
a bearer token) but needed for a real backend to actually issue one.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_store, verify_password
from app.models import LoginRequest, RegisterRequest, TokenResponse
from app.store import Store

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, store: Store = Depends(get_store)) -> TokenResponse:
    if store.get_user_by_email(body.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = store.create_user(body.email, body.password)
    return TokenResponse(access_token=store.issue_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, store: Store = Depends(get_store)) -> TokenResponse:
    user = store.get_user_by_email(body.email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=store.issue_token(user.id))
