from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_current_sprint_returns_seeded_data(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.get("/api/sprints/current", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["sprintNumber"] == 1
    assert body["day"] == 8
    assert body["committed"] is True
    assert len(body["tasks"]) == 9
    assert len(body["logs"]) == 21
    assert len(body["archive"]) == 2


def test_get_current_sprint_404s_for_user_with_no_sprint(client: TestClient) -> None:
    register = client.post("/api/auth/register", json={"email": "fresh@example.com", "password": "hunter22222"})
    token = register.json()["access_token"]
    resp = client.get("/api/sprints/current", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404


def test_set_today_state_updates_the_current_days_log(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/sprints/current/state", json={"state": "engagement"}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    today_log = next(log for log in body["logs"] if log["day"] == body["day"])
    assert today_log["state"] == "engagement"


def test_set_today_state_rejects_invalid_value(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post("/api/sprints/current/state", json={"state": "furious"}, headers=auth_headers)
    assert resp.status_code == 400


def test_add_task_appends_to_backlog(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.post(
        "/api/sprints/current/tasks",
        json={"title": "Cold plunge x2", "hours": 1, "pillar": "foundation"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["tasks"]) == 10
    added = body["tasks"][-1]
    assert added["title"] == "Cold plunge x2"
    assert added["done"] is False
    assert added["id"]


def test_add_task_rejects_hours_over_pillar_cap(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Seeded foundation tasks already total 8h (3 + 3 + 2); +3 would hit 11h > 10h cap.
    resp = client.post(
        "/api/sprints/current/tasks",
        json={"title": "Too much foundation", "hours": 3, "pillar": "foundation"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


def test_add_task_within_pillar_cap_boundary_succeeds(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Seeded foundation total is 8h; exactly 2h more lands exactly on the 10h cap.
    resp = client.post(
        "/api/sprints/current/tasks",
        json={"title": "Exactly at cap", "hours": 2, "pillar": "foundation"},
        headers=auth_headers,
    )
    assert resp.status_code == 200


def test_add_task_requires_active_sprint(client: TestClient) -> None:
    register = client.post("/api/auth/register", json={"email": "fresh2@example.com", "password": "hunter22222"})
    token = register.json()["access_token"]
    resp = client.post(
        "/api/sprints/current/tasks",
        json={"title": "Anything", "hours": 1, "pillar": "joy"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


def test_toggle_task_flips_done(client: TestClient, auth_headers: dict[str, str]) -> None:
    sprint = client.get("/api/sprints/current", headers=auth_headers).json()
    task = sprint["tasks"][1]  # seeded as done=False
    assert task["done"] is False

    resp = client.patch(f"/api/sprints/current/tasks/{task['id']}/toggle-done", headers=auth_headers)
    assert resp.status_code == 200
    toggled = next(t for t in resp.json()["tasks"] if t["id"] == task["id"])
    assert toggled["done"] is True

    resp2 = client.patch(f"/api/sprints/current/tasks/{task['id']}/toggle-done", headers=auth_headers)
    toggled_back = next(t for t in resp2.json()["tasks"] if t["id"] == task["id"])
    assert toggled_back["done"] is False


def test_toggle_task_404s_for_unknown_task(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.patch("/api/sprints/current/tasks/does-not-exist/toggle-done", headers=auth_headers)
    assert resp.status_code == 404


def test_toggle_priority_adds_and_removes(client: TestClient, auth_headers: dict[str, str]) -> None:
    sprint = client.get("/api/sprints/current", headers=auth_headers).json()
    task_id = sprint["tasks"][0]["id"]

    resp = client.patch(f"/api/sprints/current/tasks/{task_id}/toggle-priority", headers=auth_headers)
    assert resp.status_code == 200
    assert task_id in resp.json()["priorities"]

    resp2 = client.patch(f"/api/sprints/current/tasks/{task_id}/toggle-priority", headers=auth_headers)
    assert task_id not in resp2.json()["priorities"]


def test_toggle_priority_is_a_noop_past_the_cap_of_three(client: TestClient, auth_headers: dict[str, str]) -> None:
    sprint = client.get("/api/sprints/current", headers=auth_headers).json()
    task_ids = [t["id"] for t in sprint["tasks"][:4]]

    for tid in task_ids[:3]:
        resp = client.patch(f"/api/sprints/current/tasks/{tid}/toggle-priority", headers=auth_headers)
    assert sorted(resp.json()["priorities"]) == sorted(task_ids[:3])

    fourth = client.patch(f"/api/sprints/current/tasks/{task_ids[3]}/toggle-priority", headers=auth_headers)
    assert fourth.status_code == 200
    assert sorted(fourth.json()["priorities"]) == sorted(task_ids[:3])
    assert task_ids[3] not in fourth.json()["priorities"]


def test_toggle_priority_404s_for_unknown_task(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.patch("/api/sprints/current/tasks/does-not-exist/toggle-priority", headers=auth_headers)
    assert resp.status_code == 404


def test_set_gratitude_replaces_value(client: TestClient, auth_headers: dict[str, str]) -> None:
    resp = client.put("/api/sprints/current/gratitude", json={"value": "Watched the sunrise"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["gratitude"] == "Watched the sunrise"

    resp2 = client.put("/api/sprints/current/gratitude", json={"value": "Called an old friend"}, headers=auth_headers)
    assert resp2.json()["gratitude"] == "Called an old friend"


def test_sprint_endpoints_require_auth(client: TestClient) -> None:
    assert client.post("/api/sprints/current/state", json={"state": "balance"}).status_code == 401
    assert client.post("/api/sprints/current/tasks", json={"title": "x", "hours": 1, "pillar": "joy"}).status_code == 401
    assert client.patch("/api/sprints/current/tasks/abc/toggle-done").status_code == 401
    assert client.patch("/api/sprints/current/tasks/abc/toggle-priority").status_code == 401
    assert client.put("/api/sprints/current/gratitude", json={"value": "x"}).status_code == 401
