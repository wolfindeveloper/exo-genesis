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
- [x] FastAPI entry point w/ lifespan + CORS + 11 routes (auth, content, expeditions, health, user, user_ships, guide, events, bot)
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships (1: vega_mk2), zones (25), resources (3: fuel, repair_kit, fragments), boxes (1), artifacts (45)
- [x] **POST /user/ships/{id}/refuel** — заправка (single-tier restore_per_unit=10, max auto-calc)
- [x] **POST /user/ships/{id}/repair** — ремонт (single-tier restore_per_unit=10, max auto-calc)
- [x] **POST /user/ships/{id}/equip** — установка артефакта в слот (slot_index, artifact_id)
- [x] **POST /user/ships/{id}/unequip** — снятие артефакта из слота (slot_index)
- [x] **box_opener.py** — создание корабля пропускается, если у юзера уже есть
- [x] **notifier.py** — фоновый нотификатор (asyncio, каждые 30с) для Telegram при завершении экспедиции
- [x] **telegram.py** — send_message с web_app кнопкой + disable_notification
- [x] **user_activity.py** — in-memory отслеживание активных пользователей (5 min TTL)
- [x] **🧹 Cleanup Phase 2 prep:** удалены lab.py, system.py, recipe_generator.py, elements.json, element.py, lab.py (models)
- [x] **zones.json** — loot tables с fuel + repair_kit + fragments
- [x] **box_opener.py** — random_drops с T1-артефактами вместо элементов
- [x] **guide.py** — 5 endpoints: GET /guide/chapters, GET /guide/chapters/{id}, POST /guide/research, POST /guide/fix-glitch, POST /guide/claim-reward
- [x] **events.py** — POST /user/events (stare_60s, red_button_3x, fuel_below_5, toggle_sound_5x, donated)
- [x] **content/guide.json** — 4 главы (I, II, III, X), 29 статей
- [x] **artifacts.json** — +4 награды за главы (termos_optimizma, slovar_izvineniy, sinya_izolenta, ochki_veroyatnosti)
- [x] **content_loader.py** — загрузка guide.json
- [x] **Миграция 00004_guide.sql** — balance_fragments, guide_progress, chapter_progress, user_events
- [x] **main.py** — guide.router и events.router подключены

### Phase 3 — Expedition Refactor ✅
- [x] **POST /expeditions/start** — ship_id убран, авто-выбор единственного корабля пользователя
- [x] **Единая активная экспедиция** — проверка на `active_exp.data` при старте (400 если уже есть)
- [x] **Ship config fallback** — если `ship_config_id` не найден в контенте, используется `speed_mod: 1.0` по умолчанию
- [x] **resources.json** — добавлен `fragments` с `name_key: "Фрагменты бреда"` для корректного отображения в зонах

### Миграции БД
- [x] `00004_guide.sql` — баланс фрагментов, прогресс гайда, события
- [x] `00005_cleanup_user_754269918.sql` — очистка старых элементов, фикс ship_config_id

## ✅ Done — Frontend (Cockpit + Phase 1.4 + Phase 2 + Phase 3)
- [x] **Vite 8 + React 19 + Tailwind v4 + TS strict** — проект настроен
- [x] **ShipPage.tsx** — полная кабина одного корабля:
  - Canvas со 120 звёздами + 15 плавающих частиц
  - Glassmorphism-хедер: аватар, XP бар, LVL, XGEN
  - 8 круглых слотов для артефактов (3+3+2), клик открывает SlotSelectModal
  - Circular slots с rarity-свечением + космическая пыль
  - Lightning SVG с анимацией между слотами
  - Карта корабля VEGA MK-II (SVG)
  - Fuel + HP бары
  - **Секция экспедиции** под барами — таймер/кнопка забора/кнопка запуска
  - Console (4 кнопки), Easter egg sticker, Toast consoleMsg, Пилот subtitle
  - Трекинг событий: stare_60s (idle timer), red_button_3x (стикер ×3), toggle_sound_5x, fuel_below_5
- [x] **HexSlot.tsx** — круглый слот с glow-слоями, dust-частицами, name label, flicker
- [x] **SlotSelectModal.tsx** — bottom sheet со списком артефактов, equip/unequip, click-outside через mousedown+touchstart
- [x] **index.css** — @property --gradient-angle, keyframes: dust-float, lightning-flicker, glitch-sweep, scanline-down, pulse-slow, spin-gradient, fade-in, glitch-text
- [x] **App.tsx** — роутинг: `/` → ShipPage, `/guide`, `/galaxy`, `/inventory`, `/profile` (hangar удалён); NavBar: 🚀 Ангар, 📖 Гайд, 🌌 Карта, 🎒 Инв, 👤 Проф
- [x] **store/game.ts** — Zustand store: user, ships, inventory, expeditions, guideChapters; equipSlot/unequipSlot, researchEntry/fixGlitch/claimGuideReward; **startExpedition(zoneId)** вместо (shipId, zoneId)
- [x] **api/client.ts** — все endpoints: auth, ships, inventory, expeditions, guide, events; startExpedition(zoneId)
- [x] **Galaxy.tsx** — страница выбора зон, загружает корабли при монтировании
- [x] **ZoneModal.tsx** — упрощён: убран выбор корабля, авто-статы от mainShip, calcStats с fallback speed_mod=1.0
- [x] **ZoneCard.tsx** — карточка зоны с лутом, процент шанса, иконки
- [x] **GuidePage.tsx** — список глав → статьи → деталь (глюк-текст, исправление, награда)
- [x] **Inventory.tsx** — категории (топливо, ремонт, артефакты), поиск по типу, сортировка, детальный просмотр
- [x] **HudBar** — скрывается на cockpit
- [x] **NavBar** — стеклянный стиль `bg-white/5` на cockpit
- [x] **SlotSelectModal z-index** — z-[60] выше NavBar
- [x] **🧹 Cleanup:** Lab.tsx, /lab route, 🔬 навигация удалены; элементы из user_inventory очищены

### Bug fixes
- [x] **SlotSelectModal click-outside** — setTimeout → mousedown+touchstart (без орфанов)
- [x] **Slot click handler** — убран ранний return с тостом, всегда открывает модалку (фикс бага «второй раз нажать нельзя»)
- [x] **ZoneModal calcStats** — `speedMod` fallback при отсутствии shipConfig; `loadShips()` при пустом `ships`
- [x] **Expedition button centering** — `flex justify-center` wrapper + `text-center` на кнопках
- [x] **resourses.json** — добавлен `fragments` (был пропущен, отображался raw ID)

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, skills-lock.json, .opencode/, graphify-out/)
- [x] frontend/public/assets/zones/ — директория для баннеров зон

## 📋 Next Steps
1. **Profile/Streak polish** — ежедневные награды, бонусы за уровни
2. **Удалить мёртвые компоненты** — ShipCard.tsx, ShipDetailModal.tsx (заменены ShipPage)
3. **Artifact stats** — применение `stats_modifiers` к кораблю при экипировке (сейчас статы считаются в ZoneModal, но не влияют на ship)

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files
- `frontend/src/pages/ShipPage.tsx` — кабина + экспедиция (таймер, запуск, забор награды)
- `frontend/src/components/HexSlot.tsx` — круглый слот артефакта
- `frontend/src/components/SlotSelectModal.tsx` — выбор/снятие артефакта
- `frontend/src/components/ZoneModal.tsx` — детали зоны, запуск экспедиции
- `frontend/src/pages/Galaxy.tsx` — выбор зон
- `frontend/src/App.tsx` — роутинг, NavBar
- `frontend/src/index.css` — все анимации
- `frontend/src/store/game.ts` — Zustand store
- `frontend/src/api/client.ts` — API wrappers
- `frontend/src/hooks/useTimer.ts` — таймер экспедиции
- `frontend/src/lib/expeditionCalc.ts` — расчёт статов экспедиции
- `backend/app/routers/expeditions.py` — старт/клейм экспедиции
- `backend/app/services/expedition_logic.py` — расчёт лута/дамага
- `backend/content/zones.json` — 25 зон с лутом
- `backend/content/resources.json` — ресурсы (fuel, repair_kit, fragments)
- `backend/content/artifacts.json` — 45 артефактов
- `backend/content/guide.json` — 4 главы Путеводителя
- `backend/content/ships.json` — 1 корабль (vega_mk2)
