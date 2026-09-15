from app.core.security import decrypt, encrypt, mask


def test_encrypt_decrypt_roundtrip():
    plaintext = "super-secret-token-value-12345"
    ciphertext = encrypt(plaintext)
    assert ciphertext is not None
    assert ciphertext != plaintext
    assert decrypt(ciphertext) == plaintext


def test_encrypt_empty_string_returns_none():
    assert encrypt("") is None


def test_decrypt_empty_returns_none():
    assert decrypt(None) is None
    assert decrypt("") is None


def test_mask_short_value_fully_masked():
    assert mask("abcd") == "****"


def test_mask_long_value_keeps_prefix_and_suffix():
    masked = mask("sk-test-dummy-key-1234567890")
    assert masked.startswith("sk-")
    assert masked.endswith("7890")
    assert "****" in masked
    assert "dummy-key" not in masked


def test_mask_none_and_empty_return_none():
    assert mask(None) is None
    assert mask("") is None
