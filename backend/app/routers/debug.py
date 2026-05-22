import hashlib
import hmac
import logging
import os
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, Header, HTTPException
from supabase import Client

from app.core.config import settings
from app.core.dependencies import get_db
from app.services.auth import _validate_init_data

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/health")
async def debug_health():
    return {
        "env": {
            "app_name": os.environ.get("APP_NAME", ""),
            "supabase_url_set": bool(os.environ.get("SUPABASE_URL", "")),
            "supabase_key_set": bool(os.environ.get("SUPABASE_KEY", "")),
            "frontend_url": os.environ.get("FRONTEND_URL", ""),
        },
        "bot_token": {
            "os_environ_len": len(os.environ.get("BOT_TOKEN", "")),
            "os_environ_prefix": os.environ.get("BOT_TOKEN", "")[:4],
            "os_environ_suffix": os.environ.get("BOT_TOKEN", "")[-4:],
            "settings_len": len(settings.bot_token),
            "settings_prefix": settings.bot_token[:4],
            "settings_suffix": settings.bot_token[-4:],
        },
    }


@router.get("/hmac")
async def debug_hmac(
    authorization: str | None = Header(None),
    tg_init_data: str | None = None,
):
    if tg_init_data:
        init_data = tg_init_data
    elif authorization:
        init_data = authorization.removeprefix("tma ").strip()
    else:
        return {"ok": False, "error": "Provide Authorization header or ?tg_init_data=..."}

    if not init_data:
        return {"ok": False, "error": "Empty initData"}

    init_data = init_data.strip()

    # Method 1: decode then hash (current approach)
    parsed = dict(parse_qsl(init_data))
    received_hash = parsed.pop("hash", "")
    check_string_decoded = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    secret_key = hmac.new(
        settings.bot_token.encode("utf-8"),
        b"WebAppData",
        hashlib.sha256,
    ).digest()

    # Method 1b: also pop "signature" if present
    parsed2 = dict(parse_qsl(init_data))
    parsed2.pop("hash", "")
    parsed2.pop("signature", None)
    check_string_decoded_no_sig = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed2.items())
    )
    expected_decoded_no_sig = hmac.new(
        secret_key,
        check_string_decoded_no_sig.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    expected_decoded = hmac.new(
        secret_key,
        check_string_decoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Method 2b: raw without signature
    raw_dict_no_sig = {k: v for k, v in raw_dict.items() if k != "signature"}
    check_string_raw_no_sig = "\n".join(
        f"{k}={raw_dict_no_sig[k]}" for k in sorted(raw_dict_no_sig.keys())
    )

    expected_raw = hmac.new(
        secret_key,
        check_string_raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    expected_raw_no_sig = hmac.new(
        secret_key,
        check_string_raw_no_sig.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    extra_fields = [k for k in parsed.keys() if k not in ("query_id", "user", "auth_date")]
    return {
        "ok": received_hash == expected_decoded or received_hash == expected_raw,
        "match_decoded": received_hash == expected_decoded,
        "match_decoded_no_sig": received_hash == expected_decoded_no_sig,
        "match_raw": received_hash == expected_raw,
        "match_raw_no_sig": received_hash == expected_raw_no_sig,
        "received_hash": received_hash,
        "expected_decoded": expected_decoded,
        "expected_decoded_no_sig": expected_decoded_no_sig,
        "expected_raw": expected_raw,
        "expected_raw_no_sig": expected_raw_no_sig,
        "token_prefix": settings.bot_token[:6],
        "token_len": len(settings.bot_token),
        "keys": list(parsed.keys()),
        "extra_fields": extra_fields,
        "check_string_decoded": check_string_decoded[:500],
        "check_string_raw": check_string_raw[:500],
        "init_data_length": len(init_data),
    }


@router.get("/validate")
async def debug_validate(
    authorization: str = Header(None),
    db: Client = Depends(get_db),
):
    if not authorization:
        return {"ok": False, "error": "Missing Authorization header"}

    init_data = authorization.removeprefix("tma ").strip()
    try:
        payload = _validate_init_data(init_data)
    except HTTPException as e:
        return {"ok": False, "error": f"initData validation failed: {e.detail}"}
    except Exception as e:
        return {"ok": False, "error": f"initData validation error: {e}"}

    user_id = str(payload["user"]["id"])

    try:
        result = db.table("users").select("*").eq("id", user_id).execute()
    except Exception as e:
        return {"ok": False, "error": f"Supabase query error: {e}"}

    if result.data:
        return {"ok": True, "user_exists": True, "user_id": user_id, "user": result.data[0]}

    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    new_user = {
        "id": user_id,
        "username": payload["user"].get("username", ""),
        "language_code": payload["user"].get("language_code", "en"),
        "balance_xgen": 0,
        "balance_stars": 0,
        "level": 1,
        "xp": 0,
        "streak_days": 0,
        "created_at": now,
        "last_login": now,
    }

    try:
        insert_result = db.table("users").insert(new_user).execute()
        return {
            "ok": True,
            "user_exists": False,
            "user_id": user_id,
            "created_user": insert_result.data[0] if insert_result.data else None,
        }
    except Exception as e:
        return {"ok": False, "error": f"Supabase insert error: {e}", "new_user": new_user}
