from __future__ import annotations

from fastapi.testclient import TestClient


def test_fitness_prompt_returns_foundation_suggestions(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/planning/assistant", json={"prompt": "I want to improve my fitness"}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["suggestions"]
    assert all(s["pillar"] == "foundation" for s in body["suggestions"])


def test_career_prompt_returns_drive_suggestions(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/planning/assistant", json={"prompt": "help with my career"}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert all(s["pillar"] == "drive" for s in body["suggestions"])


def test_balance_prompt_returns_mixed_recovery_suggestions(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/planning/assistant", json={"prompt": "my load feels off balance"}, headers=auth_headers)
    assert resp.status_code == 200
    pillars = {s["pillar"] for s in resp.json()["suggestions"]}
    assert pillars == {"joy", "foundation"}


def test_generic_prompt_returns_one_suggestion_per_pillar(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/planning/assistant", json={"prompt": "learn to paint"}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["suggestions"]) == 3
    pillars = {s["pillar"] for s in body["suggestions"]}
    assert pillars == {"drive", "foundation", "joy"}
    assert all("learn to paint" in s["title"] for s in body["suggestions"])


def test_planning_requires_auth(client: TestClient) -> None:
    resp = client.post("/api/planning/assistant", json={"prompt": "anything"})
    assert resp.status_code == 401
