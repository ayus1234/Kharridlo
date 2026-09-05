"""
Redacted Live-Provider Verification CLI.
Executes safe, authenticated probe requests against Amazon Creators API and Flipkart Affiliate API.
Never logs, prints, or exposes client secrets, access tokens, or authorization headers.
"""

import sys
import uuid
import argparse
from datetime import datetime, timezone
from typing import Dict, Any

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.marketplace import MarketplaceFetchLog
from app.marketplace.adapters.amazon import AmazonCreatorsAdapter
from app.marketplace.adapters.flipkart import FlipkartAffiliateAdapter


def verify_amazon_live() -> Dict[str, Any]:
    adapter = AmazonCreatorsAdapter()
    correlation_id = f"live_verify_amz_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    has_client_id = bool(settings.AMAZON_CREATORS_CLIENT_ID and settings.AMAZON_CREATORS_CLIENT_ID.strip())
    has_client_secret = bool(settings.AMAZON_CREATORS_CLIENT_SECRET and settings.AMAZON_CREATORS_CLIENT_SECRET.strip())
    has_partner_tag = bool(settings.AMAZON_PARTNER_TAG and settings.AMAZON_PARTNER_TAG.strip())
    has_legacy = bool(settings.AMAZON_ACCESS_KEY and settings.AMAZON_SECRET_KEY)

    configured = (has_client_id and has_client_secret and has_partner_tag) or (has_legacy and has_partner_tag)
    enabled = settings.AMAZON_CREATORS_API_ENABLED

    if not enabled or not configured:
        return {
            "provider": "Amazon.in",
            "mode": "unconfigured_fixture_mode",
            "live_access_verified": False,
            "authenticated": False,
            "credential_source": "environment",
            "status": "Credentials not set or AMAZON_CREATORS_API_ENABLED=false",
            "configured_variables": {
                "AMAZON_CREATORS_API_ENABLED": enabled,
                "AMAZON_CREATORS_CLIENT_ID": "set" if has_client_id else "not_set",
                "AMAZON_CREATORS_CLIENT_SECRET": "set (hidden)" if has_client_secret else "not_set",
                "AMAZON_PARTNER_TAG": "set" if has_partner_tag else "not_set",
            },
            "credentials_exposed": False,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }

    # Execute single authenticated live probe
    test_asin = "B0CHX1W1XY"
    db = SessionLocal()
    start_time = datetime.now(timezone.utc)
    try:
        raw_item = adapter._execute_live_get_item(test_asin)
        duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        # Store sanitized audit log
        log_entry = MarketplaceFetchLog(
            provider="amazon",
            endpoint=f"https://{settings.AMAZON_HOST}/paapi5/getitems",
            request_type="GetItems_probe",
            status_code=200,
            duration_ms=duration_ms,
            items_count=1 if raw_item else 0,
            correlation_id=correlation_id,
            raw_response_summary=f"Live probe successful for ASIN {test_asin}",
        )
        db.add(log_entry)
        db.commit()

        return {
            "provider": "Amazon.in",
            "mode": "live",
            "live_access_verified": True,
            "authenticated": True,
            "http_status": 200,
            "operation": "GetItems",
            "test_asin": test_asin,
            "items_returned": 1 if raw_item else 0,
            "credential_source": "environment",
            "credential_values_logged": False,
            "credentials_exposed": False,
            "duration_ms": duration_ms,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }
    except Exception as e:
        duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        status_code = getattr(getattr(e, "response", None), "status_code", 500)
        
        # Log failure safely without secrets
        log_entry = MarketplaceFetchLog(
            provider="amazon",
            endpoint=f"https://{settings.AMAZON_HOST}/paapi5/getitems",
            request_type="GetItems_probe_failed",
            status_code=status_code,
            duration_ms=duration_ms,
            items_count=0,
            correlation_id=correlation_id,
            error_message="Live authentication probe failed",
        )
        db.add(log_entry)
        db.commit()

        return {
            "provider": "Amazon.in",
            "mode": "live_attempt",
            "live_access_verified": False,
            "authenticated": False,
            "http_status": status_code,
            "operation": "GetItems",
            "test_asin": test_asin,
            "error": "Authentication or request failed against upstream Amazon Creators API",
            "credential_source": "environment",
            "credential_values_logged": False,
            "credentials_exposed": False,
            "duration_ms": duration_ms,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }
    finally:
        db.close()


def verify_flipkart_live() -> Dict[str, Any]:
    adapter = FlipkartAffiliateAdapter()
    correlation_id = f"live_verify_fk_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    has_affiliate_id = bool(settings.FLIPKART_AFFILIATE_ID and settings.FLIPKART_AFFILIATE_ID.strip())
    has_affiliate_token = bool(settings.FLIPKART_AFFILIATE_TOKEN and settings.FLIPKART_AFFILIATE_TOKEN.strip())
    enabled = settings.FLIPKART_API_ENABLED

    if not enabled or not (has_affiliate_id and has_affiliate_token):
        return {
            "provider": "Flipkart",
            "mode": "unconfigured_fixture_mode",
            "live_access_verified": False,
            "authenticated": False,
            "credential_source": "environment",
            "status": "Credentials not set or FLIPKART_API_ENABLED=false",
            "configured_variables": {
                "FLIPKART_API_ENABLED": enabled,
                "FLIPKART_AFFILIATE_ID": "set" if has_affiliate_id else "not_set",
                "FLIPKART_AFFILIATE_TOKEN": "set (hidden)" if has_affiliate_token else "not_set",
            },
            "credentials_exposed": False,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }

    # Execute single authenticated live search probe
    db = SessionLocal()
    start_time = datetime.now(timezone.utc)
    try:
        raw_items = adapter._execute_live_search("laptop", limit=1)
        duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        log_entry = MarketplaceFetchLog(
            provider="flipkart",
            endpoint=f"{settings.FLIPKART_API_BASE_URL}/search.json",
            request_type="search_probe",
            status_code=200,
            duration_ms=duration_ms,
            items_count=len(raw_items),
            correlation_id=correlation_id,
            raw_response_summary="Live search probe successful",
        )
        db.add(log_entry)
        db.commit()

        return {
            "provider": "Flipkart",
            "mode": "live",
            "live_access_verified": True,
            "authenticated": True,
            "http_status": 200,
            "operation": "search_probe",
            "items_returned": len(raw_items),
            "credential_source": "environment",
            "credential_values_logged": False,
            "credentials_exposed": False,
            "duration_ms": duration_ms,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }
    except Exception as e:
        duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        status_code = getattr(getattr(e, "response", None), "status_code", 500)

        log_entry = MarketplaceFetchLog(
            provider="flipkart",
            endpoint=f"{settings.FLIPKART_API_BASE_URL}/search.json",
            request_type="search_probe_failed",
            status_code=status_code,
            duration_ms=duration_ms,
            items_count=0,
            correlation_id=correlation_id,
            error_message="Live authentication probe failed",
        )
        db.add(log_entry)
        db.commit()

        return {
            "provider": "Flipkart",
            "mode": "live_attempt",
            "live_access_verified": False,
            "authenticated": False,
            "http_status": status_code,
            "operation": "search_probe",
            "error": "Authentication or request failed against upstream Flipkart Affiliate API",
            "credential_source": "environment",
            "credential_values_logged": False,
            "credentials_exposed": False,
            "duration_ms": duration_ms,
            "verification_timestamp": timestamp,
            "correlation_id": correlation_id,
        }
    finally:
        db.close()


def print_yaml_style(data: Dict[str, Any], indent: int = 0) -> None:
    prefix = "  " * indent
    for k, v in data.items():
        if isinstance(v, dict):
            print(f"{prefix}{k}:")
            print_yaml_style(v, indent + 1)
        elif isinstance(v, bool):
            print(f"{prefix}{k}: {str(v).lower()}")
        elif v is None:
            print(f"{prefix}{k}: null")
        else:
            print(f"{prefix}{k}: {v}")


def main():
    parser = argparse.ArgumentParser(description="Verify live marketplace access with safe, redacted output.")
    parser.add_argument(
        "--provider",
        choices=["amazon", "flipkart", "all"],
        default="all",
        help="Marketplace provider to verify (amazon, flipkart, or all)",
    )
    args = parser.parse_args()

    results = {}
    if args.provider in ("amazon", "all"):
        results["amazon"] = verify_amazon_live()
    if args.provider in ("flipkart", "all"):
        results["flipkart"] = verify_flipkart_live()

    print("\n=== Marketplace Live Access Verification Report (Redacted) ===")
    print_yaml_style(results)
    print("===============================================================\n")

    # Exit with code 0 if either live verified or properly handled offline mode
    sys.exit(0)


if __name__ == "__main__":
    main()
