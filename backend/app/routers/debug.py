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
    authorization: str = Header(None),
):
    if not authorization:
        return {"ok": False, "error": "Missing Authorization header"}

    init_data = authorization.removeprefix("tma ").strip()
    parsed = dict(parse_qsl(init_data))
    received_hash = parsed.pop("hash", "")
    check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    secret_key = hmac.new(
        settings.bot_token.encode("utf-8"),
        b"WebAppData",
        hashlib.sha256,
    ).digest()

    expected_hash = hmac.new(
        secret_key,
        check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return {
        "ok": received_hash == expected_hash,
        "received_hash": received_hash,
        "expected_hash": expected_hash,
        "token_prefix": settings.bot_token[:6],
        "token_len": len(settings.bot_token),
        "keys": list(parsed.keys()),
        "check_string": check_string[:200],
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
