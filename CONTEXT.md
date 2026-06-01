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

## ✅ Done — Content
- [x] 25 элементов (5/tier, Douglas Adams стиль)
- [x] 25 зон (5/tier) с уникальными названиями, описаниями, loot tables
- [x] 25 кораблей (5/tier) с именами, описаниями, характеристиками
- [x] 10 ресурсов: fuel_t1–t5 + repair_kit_t1–t5 (Douglas Adams стиль)
- [x] 1 box: nothing_extra_starter_pack (5 guaranteed + 2 random T1 elements)
- [x] Все ID переименованы
- [x] 3 баннера зон: scrap_yard, nebula_warm_tea, the_outskirts_of_sanity
- [ ] **Запланировано:** guide_entries.json (заменит artifacts + elements)
- [ ] **Запланировано:** ресурсы одного тира (fuel, repair_kit)

## ✅ Done — Frontend (Cockpit Phase 0)
- [x] **Vite 8 + React 19 + Tailwind v4 + TS strict** — проект настроен
- [x] **ShipPage.tsx** — полная кабина одного корабля:
  - Canvas со 120 звёздами + 15 плавающих частиц (анимация)
  - Glassmorphism-хедер: аватар, XP бар, LVL, XGEN (данные из стора)
  - 8 круглых слотов для артефактов (3 слева + 3 справа + 2 снизу)
  - **Circular slots с rarity-свечением:** Tier 1=серый, 2=зелёный, 3=фиолетовый, 4=оранжевый, 5=золотой + космическая пыль (6 частиц float)
  - **Lightning SVG** с анимацией мерцания между слотами
  - **Карта корабля VEGA MK-II**: SVG, сетка 12×12, сканлайн, glitch-sweep, уголки
  - **Fuel + HP бары** под кораблём (данные из user.ships)
  - **Console (ПУЛЬТ)**: 4 кнопки с анимированной conic-gradient неоновой границей, металлическим скосом, без иконок/скобок
- [x] **HexSlot.tsx** — переиспользуемый круглый слот: glow-слои (blur-xl + blur-lg + inner nebulous), 6 dust-частиц с анимацией float, dot-индикатор, name label
- [x] **index.css** — @property --gradient-angle, keyframes: dust-float, lightning-flicker, glitch-sweep, scanline-down, pulse-slow, spin-gradient, clip-hexagon
- [x] **App.tsx** — роутинг: / и /hangar ведут на ShipPage, HudBar скрыт на cockpit, NavBar стеклянный `bg-white/5` на cockpit
- [x] **HudBar** — скрывается при переходе на cockpit
- [x] **NavBar** — меняет стиль (`bg-white/5 border-cyan-500/10`) на /hangar

### Legacy Frontend (pre-cockpit, будет заменено/удалено)
- [x] Zustand store (user, ships, inventory, activeExpeditions, experiment, stats, artifactsContent, boxRewards, pendingClaims, lastLoot)
- [x] API client с VITE_API_URL + TMA initData auth
- [x] 5 страниц: Hangar, Galaxy, Lab, Inventory, Profile
- [x] Нижняя навигация (🚀 🌌 🔬 🎒 👤)
- [x] HudBar — верхняя панель с аватаркой, ником, XP баром, XGEN на всех страницах
- [x] Profile, Galaxy, Inventory, Lab, ShipCard, ShipDetailModal, ZoneCard, ZoneModal, RewardSheet, BoxReveal
- [x] Snapshot тесты: calculateZoneStats (4 кейса, vitest)

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, skills-lock.json, .opencode/, graphify-out/)
- [x] frontend/public/assets/zones/ — директория для баннеров зон

## 📋 Next Steps

### Phase 1 — Ship & Resource Simplification
- [ ] Reduce `ships.json` to single VEGA MK-II config
- [ ] Single-tier fuel + repair kits (remove tier matching)
- [ ] Limit user_ships to 1 per user
- [ ] 8 slot device inventory management (equip/unequip)

### Phase 2 — The Guide (replaces Lab)
- [ ] Design guide_entries.json: lore, cost, reward structure
- [ ] GuidePage.tsx — browse/research entries
- [ ] Backend router + DB table for guide_progress
- [ ] Fragment economy: earn in expeditions, spend on research
- [ ] Remove Lab.tsx, Lab route, experiment endpoints

### Phase 3 — Expedition Refactor
- [ ] Single active expedition per user
- [ ] Fragment loot in zones
- [ ] Simplified expedition logic (remove tier matching)

### Phase 4 — Cleanup
- [ ] Remove elements.json, old ships.json
- [ ] Remove recipe_generator.py, experiment_log, lab router
- [ ] Simplify Zustand store (remove experiment artifacts)
- [ ] Update snapshot tests

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files (Cockpit)
- `frontend/src/pages/ShipPage.tsx` — кабина: canvas, header, 8 circular slots, lightning, ship card, fuel/HP, console
- `frontend/src/components/HexSlot.tsx` — круглый слот: tier glow, dust particles, name label
- `frontend/src/App.tsx` — routing, HudBar conditional, NavBar cockpit style
- `frontend/src/index.css` — all animations: dust-float, lightning-flicker, spin-gradient, scanline etc.
- `frontend/src/store/game.ts` — Zustand store (user, ships, inventory, expeditions)
- `frontend/src/api/client.ts` — fetch wrappers for all backend endpoints

## Relevant Files (Legacy — будет заменено)
- `frontend/src/pages/Hangar.tsx` — будет заменён на ShipPage
- `frontend/src/pages/Lab.tsx` — будет заменён на GuidePage
- `frontend/src/components/ShipCard.tsx, ShipDetailModal.tsx` — deprecated (single ship cockpit)
- `frontend/src/components/HudBar.tsx` — скрыт на cockpit
- `backend/app/routers/lab.py` — будет удалён
- `backend/app/services/recipe_generator.py` — будет удалён
- `backend/content/ships.json` — будет урезан до 1 корабля
- `backend/content/elements.json` — будет удалён
