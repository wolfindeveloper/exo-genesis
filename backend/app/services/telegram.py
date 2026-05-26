import httpx


async def send_message(bot_token: str, chat_id: int, text: str) -> None:
    if not bot_token:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
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
        f"Забери награду в игре!\n\n"
        f"\U0001f449 <a href=\"{app_url}\">Открыть игру</a>"
    )
    await send_message(bot_token, chat_id, text)
