from fastapi import Depends, Header, HTTPException
from fastapi import Request as FastAPIRequest
from supabase import Client

from app.core.config import settings
from app.services.auth import _validate_init_data
from app.services.content_loader import ContentLoader
from app.services.supabase import get_supabase


async def get_content_loader(request: FastAPIRequest) -> ContentLoader:
    return request.app.state.content_loader


async def get_settings():
    return settings


async def get_init_data_payload(
    authorization: str = Header(None),
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    init_data = authorization.removeprefix("tma ").strip()
    return _validate_init_data(init_data)


async def get_current_user_id(
    payload: dict = Depends(get_init_data_payload),
) -> str:
    user_id = str(payload["user"]["id"])
    from app.services.user_activity import mark_active

    mark_active(user_id)
    return user_id


async def get_db(supabase: Client = Depends(get_supabase)) -> Client:
    return supabase
