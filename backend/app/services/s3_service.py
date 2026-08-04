import uuid

import boto3

from app.core.config import settings

s3 = boto3.client(
    "s3",
    region_name=settings.AWS_S3_REGION,
    aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
)


def upload_file(file_bytes: bytes, original_filename: str) -> str:
    key = f"cvs/{uuid.uuid4()}-{original_filename}"
    s3.put_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, Body=file_bytes)
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )


def download_file(key: str) -> bytes:
    return s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)["Body"].read()


def delete_file(key: str) -> None:
    s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
