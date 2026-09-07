from __future__ import annotations

from fastapi.testclient import TestClient

from app.store import DEMO_EMAIL, DEMO_PASSWORD


def test_register_returns_bearer_token(client: TestClient) -> None:
    resp = client.post("/api/auth/register", json={"email": "new@example.com", "password": "hunter22222"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "hunter22222"})
    resp = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "hunter22222"})
    assert resp.status_code == 400


def test_login_with_demo_credentials_succeeds(client: TestClient) -> None:
    resp = client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


def test_login_with_wrong_password_rejected(client: TestClient) -> None:
    resp = client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": "not-the-password"})
    assert resp.status_code == 401


def test_login_with_unknown_email_rejected(client: TestClient) -> None:
    resp = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "whatever12"})
    assert resp.status_code == 401


def test_passwords_are_hashed_not_stored_in_plaintext(client: TestClient) -> None:
    store = client.app.state.store
    user = store.get_user_by_email(DEMO_EMAIL)
    assert user is not None
    assert user.hashed_password != DEMO_PASSWORD
    assert "$" in user.hashed_password  # salt$digest


def test_protected_endpoint_without_token_is_401(client: TestClient) -> None:
    resp = client.get("/api/sprints/current")
    assert resp.status_code == 401


def test_protected_endpoint_with_garbage_token_is_401(client: TestClient) -> None:
    resp = client.get("/api/sprints/current", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_protected_endpoint_with_malformed_header_is_401(client: TestClient) -> None:
    resp = client.get("/api/sprints/current", headers={"Authorization": "not-bearer-scheme"})
    assert resp.status_code == 401


def test_issued_token_grants_access(client: TestClient) -> None:
    login = client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    token = login.json()["access_token"]
    resp = client.get("/api/sprints/current", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
