# EXO-GENESIS — Context

## Project
Космическая idle/exploration игра с крафтингом, построенная как Telegram Mini App.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Supabase (sync client), Uvicorn
- **Frontend:** React 19 + Vite + TypeScript strict + Tailwind CSS v4 + Zustand + React Router v7 + Motion (Framer Motion)
- **Bot:** python-telegram-bot 22.x (webhook mode) + Telegram Bot API sendMessage
- **Infrastructure:** Vercel (frontend), HostingGuru (backend), GitHub

## ✅ Done — Backend
- [x] FastAPI entry point w/ lifespan + CORS + 13 routes (auth, content, expeditions, health, lab, system, user, user_ships, bot)
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships (25), zones (25), elements (25), resources (10), boxes (1), artifacts (0)
- [x] Supabase client + миграция (users, user_ships, user_inventory, expeditions, discoveries)
- [x] Telegram InitData HMAC-SHA256 валидация (+ signature в check_string, Bot API 8.0)
- [x] GET /user/profile — автосоздание юзера + open_box("nothing_extra_starter_pack") для новых
- [x] PATCH /user/profile — обновление username
- [x] GET /user/inventory, /user/ships, /user/stats
- [x] POST /expeditions/start, POST /expeditions/claim
- [x] GET /expeditions/active — список активных экспедиций + отправляет Telegram при завершении
- [x] Expedition logic: calculate_zone_stats() — динамический расчёт с учётом статов корабля + артефактов
- [x] Recipe Generator (weekly seed, 2-3 elem → artifact, deterministic cache)
- [x] POST /lab/experiment — крафтинг, First Discoverer, XP
- [x] GET /system/week-info — кол-во рецептов/открытий за неделю
- [x] Telegram bot: /start, /help, /profile, /feedback, webhook POST /webhook
- [x] Procfile: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [x] box_opener.py — open_box(): guaranteed + weighted random_drops из boxes.json
- [x] Snapshot тесты: calculate_zone_stats (4 кейса), boxes integrity
- [x] **POST /user/ships/{id}/refuel** — заправка корабля (tier-match, max auto-calc)
- [x] **POST /user/ships/{id}/repair** — ремонт корабля (tier-match, max auto-calc)
- [x] **user_activity.py** — in-memory отслеживание активных пользователей (5 min TTL)
- [x] **notifier.py** — фоновый нотификатор (asyncio, каждые 30с) для проактивной отправки Telegram при завершении экспедиций
- [x] **telegram.py** — send_message с web_app кнопкой + fallback на HTML-ссылку + disable_notification
- [x] GET /content/artifacts — эндпоинт для артефактов
- [x] **Duration fix** — `expedition_logic.py`: min duration изменён с 0.5h на 0.017h (~1 мин)

## ✅ Done — Content
- [x] 25 элементов (5/tier, Douglas Adams стиль)
- [x] 25 зон (5/tier) с уникальными названиями, описаниями, loot tables
- [x] 25 кораблей (5/tier) с именами, описаниями, характеристиками
- [x] 10 ресурсов: fuel_t1–t5 + repair_kit_t1–t5 (Douglas Adams стиль)
- [x] 1 box: nothing_extra_starter_pack (5 guaranteed + 2 random T1 elements)
- [x] Все ID переименованы (нет elem_hydrogen, ship_scout_t1 и т.д.)
- [x] Связи целы: все item_id в loot_table существуют в elements.json
- [x] `icon_path` добавлен в zones.json, elements.json, resources.json
- [x] 3 баннера зон загружены: scrap_yard, nebula_warm_tea, the_outskirts_of_sanity

## ✅ Done — Frontend
- [x] Vite + React 19 + TypeScript strict + Tailwind v4
- [x] Zustand store (user, ships, inventory, activeExpeditions[], experiment, stats, artifactsContent, boxRewards, pendingClaims, lastLoot)
- [x] API client с VITE_API_URL + TMA initData auth
- [x] 5 страниц: Hangar, Galaxy, Lab, Inventory, Profile
- [x] Нижняя навигация (🚀 🌌 🔬 🎒 👤)
- [x] HudBar — верхняя панель с аватаркой, ником, XP баром, XGEN на всех страницах
- [x] Profile — аватар из Telegram + редактируемый ник
- [x] BoxReveal — анимация открытия бокса для новых игроков
- [x] Snapshot тесты: calculateZoneStats (4 кейса, vitest)
- [x] vitest + vitest.config.ts
- [x] **Hangar**: табы по тирам, ShipCard pills [+🔧][+⛽] для быстрых действий, `selectedShipId` вместо `selectedShip` (не stale), `loadInventory` для кнопок
- [x] **ShipCard**: memo, live countdown, зелёное свечение + «🎁 Забрать» badge, [+🔧][+⛽] pills, actionLock ref, pendingClaim только для свежих завершений (end_time > mountTime)
- [x] **ShipDetailModal**: aspect-[3/2] арт, экспедиция первой при complete, live таймер + прогресс, умные кнопки refuel/repair с name_key, actionLock ref, artifactLookup через artifactsContent
- [x] **NotificationBanner удалён** — заменён in-app popup (Telegram.WebApp.showPopup) + ShipCard badge
- [x] **RewardSheet**: bottom sheet с добычей после claim, name_key из resourcesContent/elementsContent
- [x] **ID → name_key** — везде заменены fallback на «Неизвестный предмет/корабль/артефакт»
- [x] **Galaxy**: memo(ZoneCard) + elementLookup, confirmation, pre-select ship
- [x] **Lab**: крафт 3 слота, emoji на 25 элементов
- [x] **Inventory**: type фильтры + иконки из icon_path с fallback на emoji
- [x] **ZoneModal**: баннер зоны, выбор корабля, confirmation, pre-select ship
- [x] **useExpeditionTimer hook**: live timer с setInterval(1s), {display, pct, isComplete}
- [x] **Haptic feedback**: impactOccurred('medium') на claim, showPopup для завершений
- [x] **In-app popup** — только для свежих завершений (timer дошёл до 0 пока пользователь в приложении)

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, skills-lock.json, .opencode/, graphify-out/)
- [x] frontend/public/assets/zones/ — директория для баннеров зон

## 📋 Next Steps
### Monetization
- [ ] Telegram Stars покупки (Energy Refill, Instant Finish, Lab Hint)
- [ ] Webhook для Telegram Payments

### System
- [ ] POST /admin/generate-recipes — ручная регенерация
- [ ] GET /lab/recipes/hint — подсказки за Stars

### Artifacts
- [ ] Файл artifacts.json с конфигами артефактов (результаты крафта)
- [ ] Equip/unequip артефактов на корабли (обновление equipped_artifacts)
- [ ] Учёт артефактов в calculate_zone_stats (уже заложено)

### Shop (отложено)
- [ ] Магазин: покупка fuel/repair за XGEN

### Assets
- [ ] 22 оставшихся баннера зон
- [ ] 25 SVG-артов кораблей

### Testing
- [ ] Unit tests: recipe_generator, expedition_logic
- [ ] Integration tests: API endpoints

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files
- `backend/app/main.py`: FastAPI entry, lifespan (content load, webhook, background notifier), CORS, 13 routes
- `backend/app/routers/auth.py`: TMA валидация (initData HMAC-SHA256 + Ed25519)
- `backend/app/routers/user.py`: GET/PATCH /user/profile — создание юзера + открытие бокса для новых
- `backend/app/routers/expeditions.py`: старт/завершение/active + notification в GET /active
- `backend/app/routers/user_ships.py`: POST /{id}/refuel, POST /{id}/repair (tier-match, max auto-calc)
- `backend/app/routers/lab.py`: POST /lab/experiment с recipe validation + First Discoverer
- `backend/app/routers/system.py`: GET /system/week-info
- `backend/app/routers/content.py`: GET /content/ships, /zones, /elements, /resources, /boxes, /artifacts
- `backend/app/services/expedition_logic.py`: calculate_zone_stats, calculate_loot, calculate_damage — min duration 0.017h
- `backend/app/services/recipe_generator.py`: weekly seed, deterministic recipe generation
- `backend/app/services/content_loader.py`: загрузка ships/zones/elements/artifacts/resources/boxes JSON
- `backend/app/services/box_opener.py`: open_box() — guaranteed + weighted random_drops из boxes.json
- `backend/app/services/telegram.py`: send_message w/ web_app button + fallback HTML-link + disable_notification
- `backend/app/services/notifier.py`: background asyncio task (30s interval), checks completed expeditions proactively
- `backend/app/services/user_activity.py`: in-memory last_seen tracking, 5 min TTL
- `backend/app/services/supabase.py`: sync create_client singleton
- `backend/app/core/dependencies.py`: get_content_loader, get_db, get_init_data_payload, get_current_user_id (+ mark_active)
- `backend/app/core/config.py`: Settings (supabase, bot_token, webhook_url, frontend_url)
- `backend/tests/test_calculate_zone_stats.py`: 4 snapshot теста для expedition_logic
- `backend/tests/test_boxes_integrity.py`: проверка всех ссылок в boxes.json
- `backend/content/elements.json`: 25 элементов
- `backend/content/ships.json`: 25 кораблей
- `backend/content/zones.json`: 25 зон с loot tables
- `backend/content/resources.json`: 10 ресурсов (fuel_t1–t5, repair_kit_t1–t5)
- `frontend/src/pages/Hangar.tsx`: табы по тирам, loadShips+loadActiveExpeditions+loadInventory, selectedShipId (не stale), claim из URL
- `frontend/src/pages/Galaxy.tsx`: табы по тирам, elementLookup пропом, pre-select ship
- `frontend/src/pages/Lab.tsx`: крафт 3 слота + emoji
- `frontend/src/pages/Inventory.tsx`: type фильтры + иконки
- `frontend/src/pages/Profile.tsx`: аватар, редактируемый ник
- `frontend/src/components/ShipCard.tsx`: memo, live countdown, green glow, badge, pills, actionLock, pendingClaim + in-app popup для свежих
- `frontend/src/components/ShipDetailModal.tsx`: aspect-[3/2] арт, expedition first при complete, live таймер, claim, refuel/repair smart buttons
- `frontend/src/components/RewardSheet.tsx`: bottom sheet с добычей (name_key lookup)
- `frontend/src/components/ZoneCard.tsx`: memo + loot overflow
- `frontend/src/components/ZoneModal.tsx`: баннер зоны, выбор корабля, confirmation
- `frontend/src/components/HudBar.tsx`: верхняя панель (аватар, XP, XGEN)
- `frontend/src/components/BoxReveal.tsx`: анимация открытия бокса
- `frontend/src/hooks/useTimer.ts`: useExpeditionTimer — live countdown (setInterval 1s)
- `frontend/src/store/game.ts`: Zustand store — все состояния + actions (refuelShip, repairShip)
- `frontend/src/api/client.ts`: все API методы (refuelShip, repairShip, getArtifactsContent)
- `frontend/src/types/index.ts`: все типы (ShipActionResponse, Artifact, LootItem, ClaimResult)
