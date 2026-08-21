#!/usr/bin/env python3
"""Illustrative, runnable AWS configuration checks aligned to CIS benchmark themes.

Run only in an AWS account where you are authorized to use the supplied credentials.
Install dependency: python3 -m pip install boto3
This script intentionally paraphrases benchmark themes and does not reproduce CIS content.
"""

from __future__ import annotations

import json
import sys
from dataclasses import asdict, dataclass

import boto3
from botocore.exceptions import ClientError, NoCredentialsError


@dataclass
class CheckResult:
    check: str
    status: str
    observed: str
    remediation_hint: str


def check_root_mfa(iam) -> CheckResult:
    summary = iam.get_account_summary()["SummaryMap"]
    enabled = summary.get("AccountMFAEnabled", 0) == 1
    return CheckResult(
        "Root account MFA",
        "PASS" if enabled else "FAIL",
        "Root MFA is enabled" if enabled else "Root MFA is not enabled",
        "Enable MFA for the account root user and store recovery procedures securely.",
    )


def check_cloudtrail_multi_region(cloudtrail) -> CheckResult:
    trails = cloudtrail.describe_trails(includeShadowTrails=False).get("trailList", [])
    enabled = any(trail.get("IsMultiRegionTrail") for trail in trails)
    return CheckResult(
        "Multi-region audit logging",
        "PASS" if enabled else "FAIL",
        "A multi-region trail exists" if enabled else "No multi-region trail was found",
        "Create or update a trail to record activity across enabled regions and validate delivery.",
    )


def check_s3_public_access(s3) -> CheckResult:
    findings = []
    for bucket in s3.list_buckets().get("Buckets", []):
        name = bucket["Name"]
        try:
            config = s3.get_public_access_block(Bucket=name)["PublicAccessBlockConfiguration"]
            blocked = all(config.get(key, False) for key in [
                "BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets",
            ])
            if not blocked:
                findings.append(name)
        except ClientError as error:
            findings.append(f"{name} ({error.response['Error']['Code']})")
    return CheckResult(
        "S3 public-access safeguards",
        "PASS" if not findings else "FAIL",
        "All discovered buckets have the evaluated safeguards" if not findings else ", ".join(findings),
        "Apply account and bucket-level public-access safeguards; document an approved exception if public hosting is required.",
    )


def main() -> int:
    try:
        session = boto3.Session()
        results = [
            check_root_mfa(session.client("iam")),
            check_cloudtrail_multi_region(session.client("cloudtrail")),
            check_s3_public_access(session.client("s3")),
        ]
    except NoCredentialsError:
        print("AWS credentials were not found. Configure an authorized AWS profile or environment variables.", file=sys.stderr)
        return 2
    except ClientError as error:
        print(f"AWS API error: {error}", file=sys.stderr)
        return 3

    print(json.dumps([asdict(result) for result in results], indent=2))
    return 1 if any(result.status == "FAIL" for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())

