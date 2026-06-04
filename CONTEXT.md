# EXO-GENESIS — Context & Decisions

## Деплой (план на будущее)

### Frontend → Vercel
```bash
cd frontend
npm run build          # tsc -b && vite build → dist/
```
- Подключить репозиторий к Vercel (или залить `dist/` вручную)
- `vercel.json` уже настроен: SPA rewrites для React Router
- CORS уже разрешает `https://exo-genesis.vercel.app`

### Backend → HostingGuru
- Загрузить `backend/` на сервер (git pull / sftp)
- Установить зависимости: `uv sync` или `pip install -r requirements.txt`
- Создать `backend/.env.prod`:
  ```ini
  SUPABASE_URL=https://wirjlwytqgcrqtkbvrli.supabase.co
  SUPABASE_KEY=<prod-key>
  BOT_TOKEN=<prod-token>
  FRONTEND_URL=https://exo-genesis.vercel.app
  DEBUG=false
  WEBHOOK_URL=https://backend.production.com/webhook
  ```
- Запуск: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Настроить автозапуск (systemd / tmux / supervisor)

### Telegram Webhook (вместо polling)
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://backend.production.com/webhook"
```

### После деплоя
- Проверить CORS: фронтенд → бекенд
- Проверить initData валидацию (HMAC/Ed25519, 24h freshness)
- Проверить регистрацию нового пользователя (стартовый набор)
- Проверить экспедиции, инвентарь, корабли

---

## Стартовый набор (вместо бокса)

**Решение (2026-06-04):** Убрали `open_box("nothing_extra_starter_pack")` при регистрации.
Новый игрок получает напрямую:
- Корабль `vega_mk2` (100% прочности) в `user_ships`
- `fuel` ×20 в `user_inventory`
- `repair_kit` ×5 в `user_inventory`
- `balance_xgen` +10

См. `_grant_starter_pack()` в `backend/app/routers/user.py`.

---

## Отложенные задачи (medium/low)
- `balance_xgen` → `int()` при получении из Supabase (защита от строк)
- BoxReveal: клиент читает `item_id` сервера, а не перевыбирает из `pool`
- Придумать онбординг вместо BoxReveal для новых игроков
