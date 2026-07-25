import uuid

import boto3

from app.core.config import settings

s3 = boto3.client("s3", region_name=settings.AWS_REGION)


def upload_file(file_bytes: bytes, original_filename: str) -> str:
    key = f"cvs/{uuid.uuid4()}-{original_filename}"
    s3.put_object(Bucket=settings.S3_BUCKET, Key=key, Body=file_bytes)
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )
