def test_rule_full_lifecycle(client):
    create_resp = client.post(
        "/api/rules",
        json={
            "name": "Test rule",
            "description": "created by tests",
            "rule_type": "signature",
            "severity": "low",
            "logic": "process_name == 'notepad.exe'",
            "mitre_technique": None,
            "enabled": True,
        },
    )
    assert create_resp.status_code == 201
    rule = create_resp.json()
    rule_id = rule["id"]
    assert rule["hit_count"] == 0
    assert rule["enabled"] is True

    get_resp = client.get(f"/api/rules/{rule_id}")
    assert get_resp.status_code == 200

    update_resp = client.put(f"/api/rules/{rule_id}", json={"severity": "high"})
    assert update_resp.status_code == 200
    assert update_resp.json()["severity"] == "high"

    toggle_resp = client.patch(f"/api/rules/{rule_id}/toggle")
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["enabled"] is False

    test_resp = client.post(f"/api/rules/{rule_id}/test")
    assert test_resp.status_code == 200
    test_body = test_resp.json()
    assert test_body["matched_count"] >= 0
    assert test_body["method"] in ("heuristic", "literal_match", "no_match")

    delete_resp = client.delete(f"/api/rules/{rule_id}")
    assert delete_resp.status_code == 204

    missing_resp = client.get(f"/api/rules/{rule_id}")
    assert missing_resp.status_code == 404


def test_rule_not_found(client):
    resp = client.get("/api/rules/does-not-exist")
    assert resp.status_code == 404


def test_rule_test_uses_heuristic_for_known_mitre_technique(client):
    create_resp = client.post(
        "/api/rules",
        json={
            "name": "PowerShell encoded command",
            "description": "matches the same heuristic used for incident analysis",
            "rule_type": "signature",
            "severity": "high",
            "logic": "command_line CONTAINS '-enc'",
            "mitre_technique": "T1059.001",
            "enabled": True,
        },
    )
    rule_id = create_resp.json()["id"]

    test_resp = client.post(f"/api/rules/{rule_id}/test")
    assert test_resp.status_code == 200
    assert test_resp.json()["method"] == "heuristic"

    client.delete(f"/api/rules/{rule_id}")
