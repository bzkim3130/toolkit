def test_list_alerts_envelope(client):
    resp = client.get("/api/alerts", params={"page_size": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"items", "total", "page", "page_size"}
    assert len(body["items"]) <= 5
    assert body["total"] > 0


def test_filter_by_single_severity(client):
    resp = client.get("/api/alerts", params={"severity": "critical", "page_size": 200})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(item["severity"] == "critical" for item in items)


def test_filter_by_multiple_severities(client):
    resp = client.get("/api/alerts", params={"severity": "critical,high", "page_size": 200})
    items = resp.json()["items"]
    assert all(item["severity"] in ("critical", "high") for item in items)


def test_search_with_no_match_returns_empty(client):
    resp = client.get("/api/alerts", params={"q": "zzz_no_such_alert_zzz"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_get_alert_detail(client, sample_alert_id):
    resp = client.get(f"/api/alerts/{sample_alert_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == sample_alert_id
    assert "description" in body


def test_get_alert_not_found(client):
    resp = client.get("/api/alerts/does-not-exist")
    assert resp.status_code == 404


def test_update_alert_status_and_assignee(client, sample_alert_id):
    resp = client.patch(f"/api/alerts/{sample_alert_id}", json={"status": "investigating", "assignee": "tester"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "investigating"
    assert body["assignee"] == "tester"


def test_stats_summary_severity_and_status_totals_match(client):
    resp = client.get("/api/alerts/stats/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert sum(body["by_status"].values()) == sum(body["by_severity"].values())
