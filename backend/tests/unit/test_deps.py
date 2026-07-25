from unittest.mock import MagicMock

from app.core.config import settings
from app.core.deps import get_db


def test_get_db_reads_client_from_app_state():
    fake_db = object()
    fake_client = {settings.MONGODB_DB_NAME: fake_db}
    request = MagicMock()
    request.app.state.mongodb_client = fake_client

    assert get_db(request) is fake_db
