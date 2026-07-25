"""Fetches the app secret bundle from AWS Secrets Manager at Elastic Beanstalk
instance boot and writes it to /opt/elasticbeanstalk/deployment/env, the file EB
merges into the app process environment before starting the Docker container.

Secret name convention: cv-recommender/{ENV}/app-secrets, a JSON blob with keys
matching the environment variables the app reads (see app/core/config.py).
"""
import json
import os

import boto3

ENV = os.environ.get("ENV", "dev")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
SECRET_NAME = f"cv-recommender/{ENV}/app-secrets"
EB_ENV_FILE = "/opt/elasticbeanstalk/deployment/env"


def main() -> None:
    client = boto3.client("secretsmanager", region_name=AWS_REGION)
    secret = json.loads(client.get_secret_value(SecretId=SECRET_NAME)["SecretString"])

    lines = [f'{key}="{value}"' for key, value in secret.items()]
    with open(EB_ENV_FILE, "a") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
