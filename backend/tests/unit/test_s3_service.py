from io import BytesIO
from unittest.mock import patch

from app.services import s3_service


@patch.object(s3_service, "s3")
def test_upload_file_returns_key_with_uuid_prefix(mock_s3):
    key = s3_service.upload_file(b"raw-bytes", "resume.pdf")

    assert key.startswith("cvs/")
    assert key.endswith("-resume.pdf")
    mock_s3.put_object.assert_called_once()
    _, kwargs = mock_s3.put_object.call_args
    assert kwargs["Bucket"] == s3_service.settings.AWS_STORAGE_BUCKET_NAME
    assert kwargs["Key"] == key
    assert kwargs["Body"] == b"raw-bytes"


@patch.object(s3_service, "s3")
def test_get_presigned_url_delegates_to_boto3(mock_s3):
    mock_s3.generate_presigned_url.return_value = "https://example.com/signed"

    url = s3_service.get_presigned_url("cvs/some-key.pdf", expires_in=120)

    assert url == "https://example.com/signed"
    mock_s3.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": s3_service.settings.AWS_STORAGE_BUCKET_NAME, "Key": "cvs/some-key.pdf"},
        ExpiresIn=120,
    )


@patch.object(s3_service, "s3")
def test_download_file_returns_object_bytes(mock_s3):
    mock_s3.get_object.return_value = {"Body": BytesIO(b"file-contents")}

    result = s3_service.download_file("cvs/some-key.pdf")

    assert result == b"file-contents"
    mock_s3.get_object.assert_called_once_with(
        Bucket=s3_service.settings.AWS_STORAGE_BUCKET_NAME, Key="cvs/some-key.pdf"
    )
