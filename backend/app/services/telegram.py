import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_TME_LINK = "https://t.me/exo_genesis_bot/app"


async def send_message(
    bot_token: str,
    chat_id: int,
    text: str,
    button_text: Optional[str] = None,
    button_url: Optional[str] = None,
) -> None:
    if not bot_token:
        logger.warning("BOT_TOKEN not set, skipping notification")
        return

    payload: dict = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_notification": True,
    }

    # Use web_app button if URL looks real (not localhost)
    if button_text and button_url and "localhost" not in button_url:
        payload["reply_markup"] = {
            "inline_keyboard": [[
                {"text": button_text, "web_app": {"url": button_url}},
            ]],
        }
    elif button_text:
        # Fallback: plain HTML link as text (always works)
        payload["text"] = text + f"\n\n\U0001f449 <a href=\"{_TME_LINK}\">{button_text}</a>"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json=payload,
            )
            resp.raise_for_status()
    except Exception as e:
        logger.error("Telegram notification failed: %s", e)
        # Last-resort fallback: plain text without any button
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": text,
                        "parse_mode": "HTML",
                        "disable_notification": True,
                    },
                )
        except Exception as f:
            logger.error("Last-resort fallback also failed: %s", f)


async def notify_expedition_complete(
    bot_token: str,
    chat_id: int,
    ship_name: str,
    zone_name: str,
    frontend_url: str,
) -> None:
    text = (
        f"\U0001f680 Экспедиция завершена!\n\n"
        f"Корабль \u00ab{ship_name}\u00bb вернулся из зоны \u00ab{zone_name}\u00bb.\n"
        f"Забери награду в игре!"
    )
    await send_message(bot_token, chat_id, text, "\U0001f3ae Открыть игру", frontend_url)
