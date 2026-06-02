from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_current_user_id, get_db

router = APIRouter(prefix="/user/events", tags=["events"])


class EventRequest(BaseModel):
    event_key: str


@router.post("")
async def log_event(
    body: EventRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    allowed_events = {
        "stare_60s",
        "red_button_3x",
        "fuel_below_5",
        "toggle_sound_5x",
        "donated",
    }
    if body.event_key not in allowed_events:
        raise HTTPException(status_code=400, detail="Unknown event key")

    existing = (
        db.table("user_events")
        .select("id")
        .eq("user_id", user_id)
        .eq("event_key", body.event_key)
        .execute()
    )
    if existing.data:
        return {"status": "already_logged"}

    db.table("user_events").insert({
        "user_id": user_id,
        "event_key": body.event_key,
    }).execute()

    return {"status": "logged"}
