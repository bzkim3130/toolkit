WIDE_RANGE = {"start_time": "2000-01-01T00:00:00", "end_time": "2100-01-01T00:00:00"}


def test_search_requires_time_range(client):
    resp = client.get("/api/events/search")
    assert resp.status_code == 422


def test_search_rejects_inverted_range(client):
    resp = client.get(
        "/api/events/search",
        params={"start_time": "2026-01-02T00:00:00", "end_time": "2026-01-01T00:00:00"},
    )
    assert resp.status_code == 400


def test_search_events_basic(client):
    resp = client.get("/api/events/search", params={**WIDE_RANGE, "page_size": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) <= 5
    if body["items"]:
        assert "summary" in body["items"][0]


def test_event_context_shape(client):
    search = client.get("/api/events/search", params={**WIDE_RANGE, "page_size": 1})
    event_id = search.json()["items"][0]["id"]

    resp = client.get(f"/api/events/{event_id}/context", params={"window_minutes": 60})
    assert resp.status_code == 200
    body = resp.json()
    assert body["anchor_event"]["id"] == event_id
    assert isinstance(body["before"], list)
    assert isinstance(body["after"], list)


def test_event_not_found(client):
    resp = client.get("/api/events/does-not-exist")
    assert resp.status_code == 404


def test_analyze_requires_alert_id_or_event_ids(client):
    resp = client.post("/api/events/analyze", json={})
    assert resp.status_code == 400


def test_analyze_by_event_ids(client):
    search = client.get("/api/events/search", params={**WIDE_RANGE, "page_size": 5})
    event_ids = [e["id"] for e in search.json()["items"]]

    resp = client.post("/api/events/analyze", json={"event_ids": event_ids})
    assert resp.status_code == 200
    body = resp.json()
    assert body["verdict"] in ("likely_malicious", "suspicious", "likely_benign")
    assert body["event_count"] == len(event_ids)

    fetch_resp = client.get(f"/api/events/analyze/{body['analysis_id']}")
    assert fetch_resp.status_code == 200
    assert fetch_resp.json()["analysis_id"] == body["analysis_id"]
