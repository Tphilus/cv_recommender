from unittest.mock import AsyncMock, MagicMock

from app.main import app

# Motor's client.close() is synchronous, so the fake client below relies on
# MagicMock's default sync attribute for `close` (no AsyncMock override needed).


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_db_reachable(client):
    fake_client = MagicMock()
    fake_client.admin.command = AsyncMock(return_value={"ok": 1})
    app.state.mongodb_client = fake_client

    response = client.get("/health/db")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "message": "MongoDB is Connected"}


def test_health_db_unreachable(client):
    fake_client = MagicMock()
    fake_client.admin.command = AsyncMock(side_effect=RuntimeError("no connection"))
    app.state.mongodb_client = fake_client

    response = client.get("/health/db")

    assert response.status_code == 500
    assert response.json()["ok"] is False
