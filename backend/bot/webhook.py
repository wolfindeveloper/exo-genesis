from fastapi import APIRouter, Request
from telegram import Update
from telegram.ext import Application

from app.core.config import settings
from bot.handlers import handlers

router = APIRouter(tags=["bot"])

_bot_app: Application | None = None


async def get_bot_app() -> Application:
    global _bot_app
    if _bot_app is None:
        bot = Application.builder().token(settings.bot_token).build()
        bot.add_handlers(handlers)
        _bot_app = bot
    return _bot_app


@router.post("/webhook")
async def telegram_webhook(request: Request) -> dict:
    app = await get_bot_app()
    data = await request.json()
    update = Update.de_json(data, app.bot)
    await app.process_update(update)
    return {"ok": True}


async def set_webhook() -> None:
    if not settings.webhook_url:
        return
    app = await get_bot_app()
    await app.bot.set_webhook(f"{settings.webhook_url}/webhook")


async def delete_webhook() -> None:
    app = await get_bot_app()
    await app.bot.delete_webhook()
