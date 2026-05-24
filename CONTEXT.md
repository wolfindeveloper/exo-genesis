# EXO-GENESIS — Context

## Project
Космическая idle/exploration игра с крафтингом, построенная как Telegram Mini App.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Supabase, Uvicorn
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Zustand + React Router v7
- **Bot:** python-telegram-bot 22.x (webhook mode)
- **Infrastructure:** Vercel (frontend), HostingGuru (backend), GitHub

## ✅ Done — Backend
- [x] FastAPI entry point w/ lifespan + CORS + 11 routes
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships (25), zones (25), elements (25), resources (10), boxes (1), artifacts (0)
- [x] Supabase client + миграция (users, user_ships, user_inventory, expeditions, discoveries)
- [x] Telegram InitData HMAC-SHA256 валидация (+ signature в check_string, Bot API 8.0)
- [x] GET /user/profile — автосоздание юзера + open_box("nothing_extra_starter_pack") для новых
- [x] PATCH /user/profile — обновление username
- [x] GET /user/inventory, /user/ships, /user/stats
- [x] POST /expeditions/start, POST /expeditions/claim
- [x] **GET /expeditions/active** — список активных экспедиций юзера
- [x] Expedition logic: calculate_zone_stats() — динамический расчёт с учётом статов корабля + артефактов
- [x] Recipe Generator (weekly seed, 2-3 elem → artifact, deterministic cache)
- [x] POST /lab/experiment — крафтинг, First Discoverer, XP
- [x] GET /system/week-info — кол-во рецептов/открытий за неделю
- [x] Telegram bot: /start, /help, /profile, /feedback, webhook POST /webhook
- [x] Procfile: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [x] box_opener.py — open_box(): guaranteed + weighted random_drops из boxes.json
- [x] Snapshot тесты: calculate_zone_stats (4 кейса), boxes integrity

## ✅ Done — Content
- [x] 25 элементов (5/tier, Douglas Adams стиль) — элементы, а не материалы
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
- [x] Zustand store (user, ships, inventory, activeExpeditions[], experiment, stats, resourcesContent, boxRewards)
- [x] API client с VITE_API_URL + TMA initData auth
- [x] 5 страниц: Hangar, Galaxy, Lab, Inventory, Profile
- [x] Нижняя навигация (🚀 🌌 🔬 🎒 👤)
- [x] HudBar — верхняя панель с аватаркой, ником, XP баром, XGEN на всех страницах
- [x] Profile — аватар из Telegram + редактируемый ник (✏️ → input)
- [x] BoxReveal — анимация открытия бокса для новых игроков (opening → rewards → close)
- [x] Snapshot тесты: calculateZoneStats (4 кейса, vitest)
- [x] vitest + vitest.config.ts
- [x] **Galaxy**: memo(ZoneCard) + elementLookup пропом, confirmation step, pre-select ship из Hangar
- [x] **Inventory**: иконки ресурсов/элементов из icon_path с fallback на emoji
- [x] **ShipDetailModal**: aspect-[3/2] для крупного арта, экспедиционный блок с прогресс-баром + таймер + claim
- [x] **ShipCard**: live countdown для кораблей в экспедиции
- [x] **ZoneModal**: aspect-[3/2] object-cover для баннеров зон
- [x] **useExpeditionTimer hook**: live timer с setInterval(1s), {display, pct, isComplete}
- [x] **Haptic feedback**: impactOccurred('medium') на claim, notificationOccurred('success') при завершении

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
- [ ] APScheduler — периодические задачи
- [ ] GET /lab/recipes/hint — подсказки за Stars

### Artifacts
- [ ] Файл artifacts.json с конфигами артефактов (результаты крафта)
- [ ] Equip/unequip артефактов на корабли (обновление equipped_artifacts)
- [ ] Учёт артефактов в calculate_zone_stats (уже заложено)

### Testing
- [ ] Unit tests: recipe_generator, expedition_logic
- [ ] Integration tests: API endpoints

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files
- backend/app/main.py: FastAPI entry, lifespan, CORS, 12 routes
- backend/app/routers/auth.py: TMA валидация (initData HMAC-SHA256 + Ed25519)
- backend/app/routers/user.py: GET/PATCH /user/profile — создание юзера + открытие бокса для новых
- backend/app/routers/expeditions.py: старт/завершение экспедиций с calculate_zone_stats
- backend/app/routers/lab.py: POST /lab/experiment с recipe validation + First Discoverer
- backend/app/routers/system.py: GET /system/week-info
- backend/app/routers/content.py: GET /content/ships, /zones, /elements, /resources, /boxes
- backend/app/services/expedition_logic.py: calculate_zone_stats (динамический расчёт), calculate_loot, calculate_damage
- backend/app/services/recipe_generator.py: weekly seed, deterministic recipe generation
- backend/app/services/content_loader.py: загрузка ships/zones/elements/artifacts/resources/boxes JSON
- backend/app/services/box_opener.py: open_box() — guaranteed + weighted random_drops из boxes.json
- backend/tests/test_calculate_zone_stats.py: 4 snapshot теста для expedition_logic
- backend/tests/test_boxes_integrity.py: проверка всех ссылок в boxes.json
- backend/content/elements.json: 25 элементов (Douglas Adams стиль)
- backend/content/ships.json: 25 кораблей с описаниями, tier 1-5
- backend/content/zones.json: 25 зон с loot tables, tier 1-5
- backend/content/resources.json: 10 ресурсов (fuel_t1–t5, repair_kit_t1–t5)
- backend/content/boxes.json: starter_box (5 guaranteed + 2 random element rolls)
- frontend/src/pages/Galaxy.tsx: табы по тирам, elementLookup пропом для ZoneCard, pre-select ship из URL
- frontend/src/pages/Hangar.tsx: табы по тирам (из доступных кораблей), loadActiveExpeditions()
- frontend/src/pages/Lab.tsx: крафт 3 слота + emoji на 25 элементов
- frontend/src/pages/Inventory.tsx: type фильтры + иконки из icon_path с fallback на emoji
- frontend/src/components/ZoneModal.tsx: модалка с баннером зоны (aspect-[3/2] object-cover), выбор корабля, confirmation, пресет корабля
- frontend/src/components/ZoneCard.tsx: memo + useMemo lookup + loot overflow +N
- frontend/src/components/ShipCard.tsx: memo, live countdown для expedition кораблей
- frontend/src/components/ShipDetailModal.tsx: aspect-[3/2] арт, экспедиционный блок с таймером + прогресс + claim
- frontend/src/components/BoxReveal.tsx: анимация открытия бокса (opening → rewards)
- frontend/src/components/HudBar.tsx: верхняя панель с аватаркой, XP баром, XGEN
- frontend/src/hooks/useTimer.ts: useExpeditionTimer — live countdown хук (setInterval 1s)
- frontend/src/lib/expeditionCalc.ts: функция calculateZoneStats (дубль бэкенд-логики на фронте)
- frontend/src/lib/__tests__/expeditionCalc.test.ts: 4 snapshot теста (совпадают с backend)
- frontend/src/store/game.ts: Zustand store с activeExpeditions[], loadActiveExpeditions()
- frontend/src/types/index.ts: Zone.icon_path, Element/Resource.icon_path
