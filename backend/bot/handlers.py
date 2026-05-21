from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import CommandHandler, ContextTypes

from app.core.config import settings


async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    await update.message.reply_text(
        f"🚀 Привет, {user.first_name}!\n\n"
        "Добро пожаловать в **EXO-GENESIS** — игру об исследовании космоса, "
        "крафте артефактов и открытии новых миров.\n\n"
        "Нажми кнопку ниже, чтобы открыть Mini App:",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🚀 Открыть EXO-GENESIS", web_app={"url": settings.frontend_url})],
        ]),
    )


async def help_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📖 **Доступные команды:**\n\n"
        "/start — Запустить игру\n"
        "/help — Помощь\n"
        "/profile — Твой профиль\n"
        "/feedback — Связаться с поддержкой"
    )


async def profile(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        f"👤 **Профиль**\n\n"
        f"ID: `{update.effective_user.id}`\n"
        f"Имя: {update.effective_user.full_name}\n\n"
        "_Полные данные доступны в Mini App_"
    )


async def feedback(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text.removeprefix("/feedback").strip()
    if not text:
        await update.message.reply_text("Напиши сообщение после /feedback")
        return
    await update.message.reply_text("✅ Спасибо! Твоё сообщение передано разработчикам.")


handlers = [
    CommandHandler("start", start),
    CommandHandler("help", help_command),
    CommandHandler("profile", profile),
    CommandHandler("feedback", feedback),
]
