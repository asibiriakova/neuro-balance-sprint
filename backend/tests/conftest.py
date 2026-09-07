from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import DEMO_EMAIL, DEMO_PASSWORD, create_store


@pytest.fixture()
def client():
    """A TestClient backed by a fresh, freshly-seeded, in-memory SQLite
    store per test, so cases can't leak state into each other."""
    app.state.store = create_store(database_url="sqlite:///:memory:")
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def demo_token(client: TestClient) -> str:
    resp = client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture()
def auth_headers(demo_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {demo_token}"}
