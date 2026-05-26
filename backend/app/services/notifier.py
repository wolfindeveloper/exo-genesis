import asyncio
import logging

from app.core.config import settings
from app.services.content_loader import ContentLoader
from app.services.supabase import get_supabase
from app.services.telegram import notify_expedition_complete

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 30


async def _process_pending(content: ContentLoader) -> None:
    from datetime import datetime, timezone

    from app.services.user_activity import is_recently_active

    db = await get_supabase()

    result = db.table("expeditions").select("*").eq("status", "active").execute()
    now = datetime.now(timezone.utc)
    sent = 0

    for row in result.data or []:
        end = datetime.fromisoformat(row["end_time"])
        if end > now:
            continue

        result_data = row.get("result_data") or {}
        if result_data.get("notified"):
            continue

        user_id = row["user_id"]

        if is_recently_active(user_id):
            logger.info("skip notify for active user %s", user_id)
            continue

        user_res = db.table("users").select("id").eq("id", user_id).execute()
        if not user_res.data:
            logger.warning("user %s not found", user_id)
            continue
        chat_id = int(user_res.data[0]["id"])

        ship_res = (
            db.table("user_ships")
            .select("ship_config_id")
            .eq("id", row["ship_id"])
            .execute()
        )
        ship_config_id = (
            ship_res.data[0]["ship_config_id"] if ship_res.data else row["ship_id"]
        )
        ship_cfg = content.get_ship(ship_config_id)
        zone_cfg = content.get_zone(row["zone_config_id"])
        ship_name = (
            ship_cfg.get("name_key", ship_config_id.replace("_", " "))
            if ship_cfg
            else ship_config_id.replace("_", " ")
        )
        zone_name = (
            zone_cfg.get("name_key", row["zone_config_id"].replace("_", " "))
            if zone_cfg
            else row["zone_config_id"].replace("_", " ")
        )

        await notify_expedition_complete(
            settings.bot_token, chat_id, ship_name, zone_name, settings.frontend_url
        )

        result_data["notified"] = True
        db.table("expeditions").update({"result_data": result_data}).eq(
            "id", row["id"]
        ).execute()
        sent += 1

    if sent:
        logger.info("notifier: sent %d notifications", sent)


async def run_notifier(content: ContentLoader) -> None:
    logger.info("background notifier started (interval=%ds)", _POLL_INTERVAL)
    await asyncio.sleep(15)
    while True:
        try:
            await _process_pending(content)
        except Exception as e:
            logger.warning("notifier cycle error: %s", e)
            import traceback

            logger.warning(traceback.format_exc())
        await asyncio.sleep(_POLL_INTERVAL)
