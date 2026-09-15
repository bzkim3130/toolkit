"""Points the app at a throwaway SQLite file and a small seed before anything
under app/ is imported, so tests never touch the real dev database, and disables
the VirusTotal key so VT-route tests exercise the "not configured" path instead
of making live network calls.
"""

import os
import tempfile
from pathlib import Path

_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()

os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp_db.name).as_posix()}"
os.environ["SEED_ON_STARTUP"] = "true"
os.environ["SEED_AGENT_COUNT"] = "10"
os.environ["SEED_RULE_COUNT"] = "10"
os.environ["SEED_ALERT_COUNT"] = "60"
os.environ["SEED_EVENT_COUNT"] = "300"
os.environ["VIRUSTOTAL_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

    from app.core.database import engine

    engine.dispose()  # release SQLite's file handle before deleting it (Windows holds an exclusive lock)
    os.unlink(_tmp_db.name)


@pytest.fixture(scope="session")
def sample_alert_id(client: TestClient) -> str:
    resp = client.get("/api/alerts", params={"page_size": 1})
    return resp.json()["items"][0]["id"]


@pytest.fixture(scope="session")
def sample_agent_id(client: TestClient) -> str:
    resp = client.get("/api/agents", params={"page_size": 1})
    return resp.json()["items"][0]["id"]
