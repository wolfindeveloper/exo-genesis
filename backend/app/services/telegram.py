import httpx


async def send_inline_button(
    bot_token: str,
    chat_id: int,
    text: str,
    button_text: str,
    web_app_url: str,
) -> None:
    if not bot_token:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "reply_markup": {
                    "inline_keyboard": [[
                        {"text": button_text, "web_app": {"url": web_app_url}},
                    ]],
                },
            },
        )


async def notify_expedition_complete(
    bot_token: str,
    chat_id: int,
    ship_name: str,
    zone_name: str,
    app_url: str = "https://t.me/exo_genesis_bot/app",
) -> None:
    text = (
        f"\U0001f680 Экспедиция завершена!\n\n"
        f"Корабль \u00ab{ship_name}\u00bb вернулся из зоны \u00ab{zone_name}\u00bb.\n"
        f"Забери награду в игре!"
    )
    await send_inline_button(bot_token, chat_id, text, "\U0001f3ae Открыть игру", app_url)
