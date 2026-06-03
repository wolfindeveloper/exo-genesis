# EXO-GENESIS — Context

## Project
Космическая idle/exploration игра с одним кораблём, модульными слотами для артефактов и Путеводителем вместо Лаборатории. Стиль — «кабина внутри корабля» (cockpit), cyber-glassmorphism, neon-cyan.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Supabase (sync client), Uvicorn
- **Frontend:** React 19 + Vite 8 + TypeScript strict + Tailwind v4 + Zustand 5 + React Router v7 + Motion 12 + lucide-react
- **Bot:** python-telegram-bot 22.x (webhook mode) + Telegram Bot API sendMessage
- **Infrastructure:** Vercel (frontend), HostingGuru (backend), GitHub

---

## ✅ Done — Backend
- [x] FastAPI entry point w/ lifespan + CORS + 11 routes
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships (1: vega_mk2), zones (25), resources (3: fuel, repair_kit, fragments), boxes (1), artifacts (45)
- [x] **POST /user/ships/{id}/refuel** — заправка (single-tier, partial resources OK — uses `min(available, needed)`)
- [x] **POST /user/ships/{id}/repair** — ремонт (single-tier, partial resources OK)
- [x] **POST /user/ships/{id}/equip** — установка артефакта в слот
- [x] **POST /user/ships/{id}/unequip** — снятие артефакта из слота
- [x] **box_opener.py** — создание корабля пропускается, если у юзера уже есть; XP теперь инкрементируется (не перезаписывается)
- [x] **notifier.py** — фоновый нотификатор (asyncio, каждые 30с) для Telegram при завершении экспедиции
- [x] **telegram.py** — send_message с web_app кнопкой + disable_notification
- [x] **user_activity.py** — in-memory отслеживание активных пользователей (5 min TTL)
- [x] **progression.py** — система прогресса: `check_streak()` (ежедневные стрики с наградой фрагментами), `grant_xp()` (XP + level-up с переносом остатка)
- [x] **POST /expeditions/claim** — XP награда = `zone_tier * 25`, level-up проверка
- [x] **GET /user/profile** — отслеживание стрика при каждом входе, возвращает `daily_reward`/`streak_broken`/`daily_reward_items`
- [x] **POST /auth/validate** — отслеживание стрика при авторизации

### Phase 3 — Expedition Refactor ✅
- [x] **POST /expeditions/start** — ship_id убран, авто-выбор корабля
- [x] Единая активная экспедиция (400 если уже есть)
- [x] Ship config fallback (`speed_mod: 1.0` при отсутствии)
- [x] fragments добавлены в loot всех зон

### Миграции БД
- [x] `00004_guide.sql` — баланс фрагментов, прогресс гайда, события
- [x] `00005_cleanup_user_754269918.sql` — очистка старых элементов, fuel_t1, repair_kit_t1, фикс ship_config_id

## ✅ Done — Frontend
- [x] **ShipPage.tsx** — полная кабина:
  - Canvas (120 звёзд + 15 частиц)
  - Glassmorphism хедер с XP/LVL/XGEN
  - 8 круглых слотов с rarity-свечением
  - Lightning SVG, карта VEGA MK-II (SVG)
  - Fuel + HP бары
  - **Кнопки заправки/ремонта**: «☕ ЗАПРАВКА ЧАЕМ (N)» + «✨ ДОБАВИТЬ ОПТИМИЗМА (N)»
  - **Секция экспедиции**: таймер/забор/запуск
  - Console (4 кнопки с навигацией)
  - Easter egg sticker, toast, пилот subtitle
  - Трекинг событий: stare_60s, red_button_3x, toggle_sound_5x, fuel_below_5
- [x] **HexSlot.tsx** — круглый слот с glow, dust, flicker
- [x] **SlotSelectModal.tsx** — bottom sheet equip/unequip, click-outside mousedown+touchstart
- [x] **ZoneModal.tsx** — **artifactBonuses**: статы экипированных артефактов влияют на расчёт экспедиции
- [x] **App.tsx** — роутинг `/`, `/guide`, `/galaxy`, `/inventory`, `/profile` (hangar удалён); NavBar: 🚀 📖 🌌 🎒 👤
- [x] **store/game.ts** — Zustand: все actions; `claimExpedition` вызывает `loadProfile()` для XP/level
- [x] **Profile.tsx** — баннер ежедневной награды (🔥/🔄), стрик, XP-бар, ачивки
- [x] **HudBar** — скрыт на cockpit; ссылка `/hangar` → `/`
- [x] **🧹 Cleanup:** удалены ShipCard.tsx, ShipDetailModal.tsx, Hangar.tsx, Lab.tsx

### Bug fixes
- [x] SlotSelectModal click-outside: setTimeout → mousedown+touchstart
- [x] Slot click: всегда открывает модалку (без раннего return)
- [x] ZoneModal calcStats: speedMod fallback, loadShips() при пустом ships
- [x] Refuel/repair: partial resources вместо жёсткой проверки «Need N, have M»
- [x] resources.json: добавлен fragments

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, .opencode/, graphify-out/)

## ✅ Done — Artifact Stats Applied to Ship
- [x] **artifact_resolver.py** — новый сервис `resolve_effective_stats()`, агрегирует `stability_bonus`/`speed_mod`/`fuel_efficiency` из всех экипированных артефактов, вычисляет `effective_stats` (max_stability, max_fuel, speed_mod + суммарные бонусы)
- [x] **GET /user/ships** — возвращает `resolved_artifacts` (полные объекты артефактов) + `effective_stats`
- [x] **Refuel/Repair** — используют `effective_stats.max_fuel` / `max_stability` вместо хардкода 100
- [x] **Equip/Unequip** — возвращают обогащённый ship с `effective_stats`
- [x] **ShipPage.tsx** — бары топлива и стабильности отображают `current / effective_max`, кнопки ремонта/заправки скрыты только при `current >= effective_max`
- [x] **ShipPage.tsx** — PWR/SHLD/SPD в карточке корабля показывают реальные значения с учётом артефактов
- [x] **ZoneModal.tsx** — использует `effective_stats` из ответа API вместо локального разрешения артефактов
- [x] **expeditions/start** — использует `artifact_resolver` вместо ручного прохода по артефактам (без изменения логики)

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files
- `frontend/src/pages/ShipPage.tsx` — кабина + экспедиция + кнопки заправки/ремонта
- `frontend/src/components/ZoneModal.tsx` — детали зоны, artifactBonuses
- `frontend/src/pages/Profile.tsx` — профиль, стрик, баннер награды
- `frontend/src/store/game.ts` — Zustand store
- `frontend/src/api/client.ts` — API wrappers
- `frontend/src/lib/expeditionCalc.ts` — расчёт статов экспедиции
- `backend/app/routers/user_ships.py` — refuel/repair (partial resources), equip/unequip
- `backend/app/routers/expeditions.py` — старт/клейм с XP наградой
- `backend/app/services/progression.py` — streak + XP + level-up логика
- `backend/app/services/expedition_logic.py` — расчёт лута/дамага
- `backend/app/services/box_opener.py` — стартовый бокс
- `backend/content/artifacts.json` — 45 артефактов с stats_modifiers
- `backend/content/zones.json` — 25 зон
- `backend/content/resources.json` — fuel, repair_kit, fragments
- `backend/content/guide.json` — Путеводитель (4 главы)
- `backend/supabase/migrations/00005_cleanup_user_754269918.sql` — очистка легаси
