def test_settings_default_state(client):
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["llm_endpoint"] is None
    assert body["llm_api_key_masked"] is None


def test_settings_update_masks_secret(client):
    resp = client.put(
        "/api/settings",
        json={"llm_endpoint": "http://localhost:1234/v1/chat", "llm_api_key": "sk-abcdefghijklmno"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["llm_endpoint"] == "http://localhost:1234/v1/chat"
    assert body["llm_api_key_masked"] is not None
    assert "sk-abcdefghijklmno" not in body["llm_api_key_masked"]
    assert body["llm_api_key_masked"].endswith("lmno")


def test_settings_partial_update_preserves_unspecified_fields(client):
    client.put("/api/settings", json={"llm_model": "model-a"})
    resp = client.put("/api/settings", json={"llm_endpoint": "http://example.com"})
    body = resp.json()
    assert body["llm_model"] == "model-a"
    assert body["llm_endpoint"] == "http://example.com"


def test_settings_clear_secret_with_empty_string(client):
    client.put("/api/settings", json={"edr_api_token": "some-token-value"})
    assert client.get("/api/settings").json()["edr_api_token_masked"] is not None

    resp = client.put("/api/settings", json={"edr_api_token": ""})
    assert resp.json()["edr_api_token_masked"] is None


def test_test_connection_unreachable_target_reports_failure(client):
    client.put("/api/settings", json={"edr_api_url": "http://127.0.0.1:9/nowhere"})
    resp = client.post("/api/settings/test-connection", json={"target": "edr"})
    assert resp.status_code == 200
    assert resp.json()["ok"] is False


def test_test_connection_missing_url_reports_failure(client):
    client.put("/api/settings", json={"ndr_api_url": ""})
    resp = client.post("/api/settings/test-connection", json={"target": "ndr"})
    assert resp.json()["ok"] is False


def test_vt_lookup_without_key_returns_503(client):
    resp = client.get("/api/vt/file/deadbeefdeadbeefdeadbeefdeadbeef")
    assert resp.status_code == 503
