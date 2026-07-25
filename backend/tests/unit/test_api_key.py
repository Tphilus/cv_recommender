import pytest
from fastapi import HTTPException

from app.auth.api_key import require_api_key
from app.core.config import settings


async def test_require_api_key_accepts_correct_key():
    await require_api_key(x_api_key=settings.API_KEY)  # should not raise


async def test_require_api_key_rejects_wrong_key():
    with pytest.raises(HTTPException) as exc_info:
        await require_api_key(x_api_key="wrong-key")
    assert exc_info.value.status_code == 401
