def test_list_agents(client):
    resp = client.get("/api/agents", params={"page_size": 5})
    assert resp.status_code == 200
    assert resp.json()["total"] > 0


def test_get_agent_detail_has_alert_counts(client, sample_agent_id):
    resp = client.get(f"/api/agents/{sample_agent_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["open_alert_count"] >= 0
    assert body["total_alert_count"] >= body["open_alert_count"]


def test_get_agent_not_found(client):
    resp = client.get("/api/agents/does-not-exist")
    assert resp.status_code == 404


def test_isolate_and_unisolate_agent(client, sample_agent_id):
    resp = client.post(f"/api/agents/{sample_agent_id}/isolate")
    assert resp.status_code == 200
    assert resp.json()["status"] == "isolated"

    resp = client.post(f"/api/agents/{sample_agent_id}/unisolate")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"


def test_agent_events_paginated(client, sample_agent_id):
    resp = client.get(f"/api/agents/{sample_agent_id}/events", params={"page_size": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert body["page_size"] == 5
    assert len(body["items"]) <= 5
