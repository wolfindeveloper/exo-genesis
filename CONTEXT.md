# EXO-GENESIS — Context

## Project
Космическая idle/exploration игра с крафтингом, построенная как Telegram Mini App.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Supabase, Uvicorn
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Zustand + React Router v7
- **Bot:** python-telegram-bot 22.x (webhook mode)
- **Infrastructure:** Vercel (frontend), HostingGuru (backend), GitHub

## ✅ Done — Backend
- [x] FastAPI entry point w/ lifespan + CORS + 10 routes
- [x] Pydantic Settings (.env: supabase, bot, webhook, frontend)
- [x] ContentLoader — ships.json (5), zones.json (5), elements.json (10)
- [x] Supabase client + миграция (users, user_ships, user_inventory, expeditions, discoveries)
- [x] Telegram InitData HMAC-SHA256 валидация
- [x] POST /auth/validate — регистрация/логин через TMA
- [x] GET /user/profile, /user/inventory, /user/ships, /user/stats
- [x] POST /expeditions/start, POST /expeditions/claim
- [x] Recipe Generator (weekly seed, 2-3 elem → artifact, deterministic cache)
- [x] POST /lab/experiment — крафтинг, First Discoverer, XP
- [x] GET /system/week-info — кол-во рецептов/открытий за неделю
- [x] Telegram bot: /start, /help, /profile, /feedback, webhook POST /webhook
- [x] Procfile: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## ✅ Done — Content
- [x] 5 кораблей tier 1-5
- [x] 5 зон с loot tables + risk factor
- [x] 10 элементов common→legendary

## ✅ Done — Frontend
- [x] Vite + React 19 + TypeScript strict + Tailwind v4
- [x] Zustand store (user, ships, inventory, expeditions, experiment, stats)
- [x] API client с VITE_API_URL + TMA initData auth
- [x] 5 страниц: Hangar, Galaxy, Lab, Inventory, Profile
- [x] Нижняя навигация (🚀 🌌 🔬 🎒 👤)
- [x] Telegram Mini App SDK интеграция

## ✅ Done — Infrastructure
- [x] GitHub: wolfindeveloper/exo-genesis
- [x] Vercel: exo-genesis.vercel.app (auto-deploy on push)
- [x] HostingGuru: exo-genesis-1ac1.apps.hostingguru.io (manual redeploy)
- [x] .gitignore + .git/info/exclude (SPEC.md, AGENTS.md, CONTEXT.md, skills-lock.json, .opencode/, graphify-out/)

## 📋 Next Steps
### Monetization
- [ ] Telegram Stars покупки (Energy Refill, Instant Finish, Lab Hint)
- [ ] Webhook для Telegram Payments

### System
- [ ] POST /admin/generate-recipes — ручная регенерация
- [ ] APScheduler — периодические задачи
- [ ] GET /lab/recipes/hint — подсказки за Stars

### UI/Visual ✅
- [x] Motion library: page transitions, staggered entry, hover/tap effects, XP bar animation, craft sparkles
- [x] Starfield фон (CSS частицы + nebula градиенты)
- [x] Glassmorphism карточки с glow-эффектами по tier
- [x] Шрифты: Orbitron (заголовки) + Manrope (текст)
- [x] Rarity-цвета (common→legendary) на все карточки
- [x] Shimmer loading states

### Testing
- [ ] Unit tests: recipe_generator, expedition_logic
- [ ] Integration tests: API endpoints

## 📡 URLs
- **Frontend:** https://exo-genesis.vercel.app
- **Backend:** https://exo-genesis-1ac1.apps.hostingguru.io
- **API Docs:** https://exo-genesis-1ac1.apps.hostingguru.io/docs
- **GitHub:** https://github.com/wolfindeveloper/exo-genesis
