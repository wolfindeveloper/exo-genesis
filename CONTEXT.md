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
- [x] FastAPI entry point w/ lifespan + CORS + 11 routes (auth, content, expeditions, health, user, user_ships, bot)
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships (1), zones (25), resources (2), boxes (1), artifacts (18) — elements удалены
- [x] **POST /user/ships/{id}/refuel** — заправка (single-tier restore_per_unit=10, max auto-calc)
- [x] **POST /user/ships/{id}/repair** — ремонт (single-tier restore_per_unit=10, max auto-calc)
- [x] **POST /user/ships/{id}/equip** — установка артефакта в слот (slot_index, artifact_id)
- [x] **POST /user/ships/{id}/unequip** — снятие артефакта из слота (slot_index)
- [x] **box_opener.py** — создание корабля пропускается, если у юзера уже есть
- [x] **notifier.py** — фоновый нотификатор (asyncio, каждые 30с) для Telegram при завершении экспедиции
- [x] **telegram.py** — send_message с web_app кнопкой + disable_notification
- [x] **user_activity.py** — in-memory отслеживание активных пользователей (5 min TTL)
- [x] **🧹 Cleanup Phase 2 prep:** удалены lab.py, system.py, recipe_generator.py, elements.json, element.py, lab.py (models)
- [x] **zones.json** — loot tables заменены с элементов на ресурсы (fuel + repair_kit)
- [x] **box_opener.py** — random_drops заменены с элементов на T1-артефакты
- [x] **guide.py** — 5 endpoints: GET /guide/chapters, GET /guide/chapters/{id}, POST /guide/research, POST /guide/fix-glitch, POST /guide/claim-reward
- [x] **events.py** — POST /user/events (stare_60s, red_button_3x, fuel_below_5, toggle_sound_5x, donated)
- [x] **content/guide.json** — 4 главы (I, II, III, X), 29 статей с текстами, ценами, glitch_chance, unlock_event
- [x] **artifacts.json** — +4 награды за главы (termos_optimizma, slovar_izvineniy, sinya_izolenta, ochki_veroyatnosti)
- [x] **content_loader.py** — загрузка guide.json, методы get_guide_entry/get_guide_chapter
- [x] **zones.json** — fragments добавлены в loot_table всех зон
- [x] **expeditions.py** — обработка fragments в луте + fuel_below_5 event
- [x] **Миграция 00004_guide.sql** — balance_fragments, guide_progress, chapter_progress, user_events
- [x] **main.py** — подключены guide.router и events.router

## ✅ Done — Frontend (Cockpit + Phase 1.4 + Phase 2)
- [x] **Vite 8 + React 19 + Tailwind v4 + TS strict** — проект настроен
- [x] **ShipPage.tsx** — полная кабина одного корабля:
  - Canvas со 120 звёздами + 15 плавающих частиц (анимация)
  - Glassmorphism-хедер: аватар, XP бар, LVL, XGEN (данные из стора)
  - 8 круглых слотов для артефактов (3 слева + 3 справа + 2 снизу), клик открывает SlotSelectModal
  - **Circular slots с rarity-свечением:** Tier 1=серый, 2=зелёный, 3=фиолетовый, 4=оранжевый, 5=золотой + космическая пыль (6 частиц float)
  - **Lightning SVG** с анимацией мерцания между слотами
  - **Карта корабля VEGA MK-II**: SVG, сетка 12×12, сканлайн, glitch-sweep, уголки
  - **Fuel + HP бары** под кораблём (данные из user.ships)
  - **Console (ПАНЕЛЬ СЛОЖНЫХ РЕШЕНИЙ)**: 4 кнопки — ГДЕ-ТО ТАМ (toast), КОЛЛЕКЦИЯ ХЛАМА, НЕ ПАНИКУЙТЕ, СПЕКУЛЯТИВНАЯ ЛАВКА (subtitle)
  - **Easter egg sticker** — появляется каждые 2-6ч на 15мин, цикл сообщений по клику, +1 XGEN на финальном
  - **Toast consoleMsg** — auto-dismiss уведомление при клике на «ГДЕ-ТО ТАМ»
  - **Пилот subtitle** — «Пока еще не поглощен черной дырой» под ником
  - **setUser** — обновление данных юзера в сторе
- [x] **HexSlot.tsx** — круглый слот: glow-слои (blur-xl + blur-lg + inner nebulous), 6 dust-частиц float, name label, onClick, flicker animation
- [x] **SlotSelectModal.tsx** — bottom sheet: список артефактов из инвентаря, кнопка «СНЯТЬ» для экипированного, tier badges, закрытие по Escape/клику вне
- [x] **index.css** — @property --gradient-angle, keyframes: dust-float, lightning-flicker, glitch-sweep, scanline-down, pulse-slow, spin-gradient, clip-hexagon, **fade-in**
- [x] **App.tsx** — роутинг: / и /hangar ведут на ShipPage, HudBar скрыт на cockpit, NavBar стеклянный `bg-white/5` на cockpit
- [x] **store/game.ts** — Zustand store: user, ships, inventory, expeditions; **equipSlot/unequipSlot actions**; **setUser**
- [x] **api/client.ts** — fetch wrappers: **equipSlot, unequipSlot**, updateProfile с add_xgen
- [x] **HudBar** — скрывается при переходе на cockpit
- [x] **NavBar** — меняет стиль (`bg-white/5 border-cyan-500/10`) на /hangar
- [x] **Console buttons navigate** — ГДЕ-ТО ТАМ → /galaxy, КОЛЛЕКЦИЯ ХЛАМА → /inventory
- [x] **Zone loot percentages** — шанс выпадения отображается в карточках и модалке зон
- [x] **SlotSelectModal z-index фикс** — теперь выше навбара (z-[60])
- [x] **🧹 Cleanup:** удалены Lab.tsx, /lab route, 🔬 навигация, experiment/lab из стора/api/types
- [x] **Inventory/ZoneCard/ZoneModal** — названия предметов из resourcesContent + artifactsContent
- [x] **БД:** удалено 45 строк elements из user_inventory
- [x] **GuidePage.tsx** — список глав → статьи → деталь статьи (глюк-текст, исправление, награда)
- [x] **App.tsx** — /guide route, 📖 Гайд в BottomNav
- [x] **api/client.ts** — getGuideChapters, getGuideChapter, researchEntry, fixGlitch, claimReward, logEvent
- [x] **store/game.ts** — guideChapters state, loadGuideChapters, researchEntry, fixGlitch, claimGuideReward actions
- [x] **ShipPage.tsx** — трекинг событий: stare_60s (idle timer), red_button_3x (стикер ×3), toggle_sound_5x (🔊 кнопка); useCallback для onClose slot-модала; Douglas Adams сообщение при пустом инвентаре
- [x] **index.css** — glitch-text keyframe
- [x] **SlotSelectModal.tsx** — фикс click-outside: setTimeout заменён на mousedown+touchstart (исправляет баг с повторным открытием слотов)

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, skills-lock.json, .opencode/, graphify-out/)
- [x] frontend/public/assets/zones/ — директория для баннеров зон

## 📋 Next Steps

### Phase 1 — Ship & Resource Simplification ✅
- [x] Reduce `ships.json` to single VEGA MK-II config
- [x] Single-tier fuel + repair kits (remove tier matching)
- [x] Limit user_ships to 1 per user
- [x] 8 slot device inventory management (equip/unequip)

### Phase 2 — The Guide (replaces Lab)
- [ ] Design guide_entries.json: lore, cost, reward structure
- [ ] GuidePage.tsx — browse/research entries
- [ ] Backend router + DB table for guide_progress + balance_fragments
- [ ] Fragment economy: earn in expeditions, spend on research
- [x] Remove Lab.tsx, Lab route, experiment endpoints, elements.json, recipe_generator.py, system.py, lab router

### Phase 3 — Expedition Refactor
- [ ] Single active expedition per user
- [ ] Fragment + artifact drops in zones (replace current fuel/repair loot)
- [ ] Simplified expedition logic (remove tier matching)
- [ ] artifact_drops с шансом в зонах

### Phase 4 — Cleanup ✅
- [x] Remove elements.json, old ships.json
- [x] Remove recipe_generator.py, experiment_log, lab router
- [x] Simplify Zustand store (remove experiment artifacts)
- [x] Update boxes/tests (artifact drops instead of elements)

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis

## Relevant Files (Cockpit)
- `frontend/src/pages/ShipPage.tsx` — кабина: canvas, header, 8 circular slots, lightning, ship card, fuel/HP, console (кнопки навигируют), sticker, toast
- `frontend/src/components/HexSlot.tsx` — круглый слот: tier glow, dust particles, name label, onClick
- `frontend/src/components/SlotSelectModal.tsx` — bottom sheet: список артефактов, equip/unequip, tier badges
- `frontend/src/App.tsx` — routing, HudBar conditional, NavBar cockpit style (Lab удалён)
- `frontend/src/index.css` — all animations: dust-float, lightning-flicker, spin-gradient, scanline, fade-in etc.
- `frontend/src/store/game.ts` — Zustand store (user, ships, inventory, expeditions, equipSlot/unequipSlot)
- `frontend/src/api/client.ts` — fetch wrappers for all backend endpoints

## Relevant Files (Legacy — будет заменено)
- `frontend/src/pages/Hangar.tsx` — будет заменён на ShipPage
- `frontend/src/components/ShipCard.tsx, ShipDetailModal.tsx` — deprecated (single ship cockpit)
- `frontend/src/components/HudBar.tsx` — скрыт на cockpit
