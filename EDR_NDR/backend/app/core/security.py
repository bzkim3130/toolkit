"""Local-only secret storage via Windows DPAPI.

CryptProtectData binds the ciphertext to the current Windows user account — only a
process running as this same user on this same machine can decrypt it. The entropy
value is an extra pepper mixed in on top of that, not a secret in itself.
"""

import base64

import win32crypt

from app.core.config import settings

CRYPTPROTECT_UI_FORBIDDEN = 0x1  # never allow a UI prompt from a backend process


def _entropy() -> bytes:
    return settings.dpapi_entropy.encode("utf-8")


def encrypt(plaintext: str) -> str | None:
    if not plaintext:
        return None
    blob = win32crypt.CryptProtectData(
        plaintext.encode("utf-8"), "edr-ndr-dashboard", _entropy(), None, None, CRYPTPROTECT_UI_FORBIDDEN
    )
    return base64.b64encode(blob).decode("ascii")


def decrypt(ciphertext_b64: str | None) -> str | None:
    if not ciphertext_b64:
        return None
    blob = base64.b64decode(ciphertext_b64)
    _description, plaintext = win32crypt.CryptUnprotectData(blob, _entropy(), None, None, CRYPTPROTECT_UI_FORBIDDEN)
    return plaintext.decode("utf-8")


def mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:3]}{'*' * 4}{value[-4:]}"
