import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import HTTPException
from pydantic import BaseModel

from app.core.config import settings


class TelegramUser(BaseModel):
    id: int
    first_name: str = ""
    last_name: str = ""
    username: str = ""
    language_code: str = "en"
    is_premium: bool = False


class InitDataPayload(BaseModel):
    user: TelegramUser
    auth_date: int
    hash: str
    query_id: str | None = None
    chat_type: str | None = None
    chat_instance: str | None = None
    start_param: str | None = None


def _validate_init_data(init_data_raw: str) -> dict:
    parsed = dict(parse_qsl(init_data_raw))
    received_hash = parsed.pop("hash", "")
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash in initData")

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

    if received_hash != expected_hash:
        raise HTTPException(status_code=401, detail="Invalid initData signature")

    user_data = parsed.get("user", "{}")
    user_dict = json.loads(user_data) if isinstance(user_data, str) else user_data
    validated = InitDataPayload(
        user=TelegramUser(**user_dict),
        auth_date=int(parsed.get("auth_date", "0")),
        hash=received_hash,
        query_id=parsed.get("query_id"),
        chat_type=parsed.get("chat_type"),
        chat_instance=parsed.get("chat_instance"),
        start_param=parsed.get("start_param"),
    )
    return validated.model_dump()
