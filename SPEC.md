# Project Specification: EXO-GENESIS (Telegram Mini App)

## 1. Overview
**Exo-Genesis** is a space-themed idle/exploration game built as a Telegram Mini App (TMA). The player pilots a single ship (VEGA MK-II) with modular artifact/memory slots, researches The Guide for lore and progression, and embarks on expeditions into unknown zones.

* **Core Loop:** Single ship cockpit → install artifacts into slots (8 circles with tier-based rarity glow) → send ship on expeditions → collect information fragments → use fragments to research entries in The Guide → unlock lore, stats, and new abilities.
* **Key Feature:** *Cockpit UI* — The game feels like sitting inside a starship: glassmorphism HUD, radar/monitor display, hex/circular artifact slots with animated neon glow and space dust, lightning FX between slots, trapezoidal console with floating neon gradient buttons.
* **No fleet:** One ship only. Progression is vertical (slot upgrades, Guide research) not horizontal (multiple ships).

---

## 2. Tech Stack & Constraints

### Backend
* **Language:** Python 3.11+
* **Framework:** FastAPI (Async)
* **Database:** Supabase (PostgreSQL) for user data.
* **Content Storage:** JSON files (static game config) loaded into memory/cache.
* **State Management:** Stateless API. All state persisted in DB.
* **Task Queue:** APScheduler (for periodic tasks like recipe generation, expedition completion checks).

### Frontend
* **Framework:** React 19 + Vite 8
* **Language:** TypeScript ~6.0 (Strict mode)
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin)
* **State Management:** Zustand 5
* **Telegram Integration:** `@twa-dev/sdk` 8 + native `Telegram.WebApp` API
* **Animations:** Motion 12 (formerly Framer Motion)
* **UI Components:** Custom components with Tailwind. Icons via `lucide-react`.
* **Routing:** React Router v7 (BrowserRouter, AnimatePresence transitions)

### Infrastructure
* **Hosting:**
    * **Frontend:** Vercel (auto-deploy from GitHub)
    * **Backend:** HostingGuru (Docker/Procfile)
* **Environment Variables:** `.env` for secrets (Supabase URL/Key, Bot Token).

---

## 3. Architecture Principles

### 3.1 Data Separation (Crucial)
* **Static Content (Read-Only):** Ships (1 config), Zones, Guide Entries, Resources.
    * Stored in `/content/*.json`.
    * Loaded by `ContentLoader` service at startup.
    * Cached in memory (`lru_cache` or global dict).
    * **NEVER** store static content in DB.
* **User Data (Read-Write):** Inventory, Balance, Ship Status, Expedition Logs, Guide Progress.
    * Stored in Supabase PostgreSQL.
    * Accessed via async DB clients.

### 3.2 Security & Integrity
* **Double-Click Protection:** Frontend disables buttons during API calls. Backend uses DB constraints/transactions to prevent race conditions (e.g., spending fuel twice).
* **Input Validation:** All API inputs validated via Pydantic models.
* **Auth:** Telegram WebApp `InitData` validation on backend for every request.

### 3.3 Scalability
* Code must be modular. Switching from JSON content to DB content should only require changing the `ContentLoader` implementation, not business logic.

---

## 4. Database Schema (Supabase/PostgreSQL)

### Tables

#### `users`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | TEXT | Primary Key (Telegram User ID) |
| `username` | TEXT | |
| `language_code` | TEXT | e.g., `'en'`, `'ru'` |
| `balance_xgen` | INTEGER | Default: `0` |
| `balance_stars` | INTEGER | Default: `0` |
| `balance_fragments` | INTEGER | Default: `0` — fragment currency for The Guide |
| `level` | INTEGER | Default: `1` |
| `xp` | INTEGER | Default: `0` |
| `created_at` | TIMESTAMPTZ | |
| `last_login` | TIMESTAMPTZ | |
| `streak_days` | INTEGER | |

#### `user_ships` (single ship per user)
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` (unique, one ship) |
| `ship_config_id` | TEXT | References `ships.json` ID |
| `status` | ENUM | `'idle'`, `'expedition'`, `'repair'` |
| `stability` | FLOAT | `0.0` - `100.0` |
| `fuel_current` | INTEGER | |
| `equipped_artifacts` | JSONB | Array of artifact IDs installed in 8 slots |
| `acquired_at` | TIMESTAMPTZ | |

#### `user_inventory`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` |
| `item_type` | ENUM | `'resource'`, `'artifact'`, `'consumable'`, `'fragment'` |
| `item_config_id` | TEXT | References JSON config ID |
| `quantity` | INTEGER | |
| `metadata` | JSONB | For unique artifacts |

#### `expeditions`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` |
| `ship_id` | UUID | Foreign Key → `user_ships.id` |
| `zone_config_id` | TEXT | References `zones.json` ID |
| `start_time` | TIMESTAMPTZ | |
| `end_time` | TIMESTAMPTZ | |
| `status` | ENUM | `'active'`, `'completed'`, `'failed'` |
| `result_data` | JSONB | Loot table result (nullable until completed) |

#### `guide_progress` (tracks per-entry research status)
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` |
| `chapter_id` | TEXT | References `guide.json` chapter ID |
| `entry_id` | TEXT | References `guide.json` entry ID |
| `status` | TEXT | `'locked'`, `'researched'`, `'glitched'` |
| UNIQUE(user_id, chapter_id, entry_id) | | |

#### `chapter_progress` (per-chapter completion + reward claiming)
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` |
| `chapter_id` | TEXT | References `guide.json` chapter ID |
| `reward_claimed` | BOOLEAN | Default: `false` |
| UNIQUE(user_id, chapter_id) | | |

#### `user_events` (action tracking for dynamic chapter unlocks)
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | TEXT | Foreign Key → `users.id` |
| `event_key` | TEXT | e.g., `'stare_60s'`, `'red_button_3x'`, `'fuel_below_5'` |
| `completed_at` | TIMESTAMPTZ | Default: `now()` |
| UNIQUE(user_id, event_key) | | |

---

## 5. Content Structure (JSON)
All JSON files reside in `/backend/content/`.

### `ships.json` (single ship only — VEGA MK-II)
```json
[
  {
    "id": "vega_mk2",
    "name_key": "VEGA MK-II",
    "tier": 3,
    "stats": { "stability": 100, "fuel_capacity": 100, "speed_mod": 1.0 },
    "slots": 8
  }
]
```

### `zones.json` (expedition destinations)
```json
[{
  "id": "zone_nebula_alpha",
  "name_key": "zone_nebula_name",
  "tier": 1,
  "risk_factor": 0.1,
  "loot_table": [
    { "item_id": "fragment_data", "weight": 50, "min": 1, "max": 3 },
    { "item_id": "fuel_t1", "weight": 30, "min": 5, "max": 10 }
  ],
  "duration_hours": 12
}]
```

### `guide.json` (chapters with entries — replaces Lab)
Chapters group related entries. Each entry has a fragment cost and optional glitch chance. Some entries use `unlock_event` instead of fragment cost for dynamic discovery. Each chapter has a reward artifact granted when all entries are researched.
```json
{
  "chapters": [
    {
      "id": "ch_basics",
      "title": "Глава I: Основы бытия",
      "description": "Понять, что паника — это не выход.",
      "order": 1,
      "reward_artifact_id": "termos_optimizma",
      "entries": [
        {
          "id": "why_ship_sighs",
          "title": "Почему корабль издает звуки вздоха?",
          "text": "Вега МК-II очень старается...",
          "fragment_cost": 1,
          "glitch_chance": 0.2
        },
        {
          "id": "stare_effect",
          "title": "Эффект созерцания",
          "text": "Вселенная существует только тогда...",
          "unlock_event": "stare_60s",
          "fragment_cost": 0,
          "glitch_chance": 0
        }
      ]
    }
  ]
}
```

### `resources.json` (fuel + repair kits, single tier)
```json
[
  { "id": "fuel", "name_key": "Топливо", "resource_type": "fuel", "tier": 1, "icon_path": "..." },
  { "id": "repair_kit", "name_key": "Ремкомплект", "resource_type": "repair", "tier": 1, "icon_path": "..." }
]
```

---

## 6. Core Business Logic

### 6.1 Expedition Logic
- One active expedition at a time (single ship).
- Ship must be idle, fuel > 0, stability > 0.
- Deduct fuel on start. Apply damage on return.
- Loot includes information fragments (for The Guide) + resources.
- Fuel and repair kits are single-tier (no tier matching).

### 6.2 The Guide (Research)
- Replaces the Lab + crafting system.
- Guide entries are pre-defined lore/research nodes.
- Each entry has a `fragment_cost` — pay fragments to unlock.
- Unlocking an entry may grant: lore text, stat bonuses, new slot abilities, cosmetic unlocks.
- No recipes, no RNG crafting, no First Discoverer.

### 6.3 Monetization (Telegram Stars)
- Endpoints for purchasing: Fuel Refill, Instant Finish, Fragment Packs.
- Webhook handler verifies Telegram payment signature.

---

## 7. API Endpoints (FastAPI)

### Auth
* `POST /auth/validate`: Validate Telegram InitData, return/create user profile.

### User Profile
* `GET /user/profile`: Get stats, balances, level.
* `PATCH /user/profile`: Update username or add XGEN (`{ username?, add_xgen? }`).
* `GET /user/inventory`: List items (resources, artifacts, fragments).
* `GET /user/ships`: Get single ship with status + equipped slots.

### Gameplay
* `POST /expeditions/start`: Body `{ zone_id }` (single ship implied).
* `POST /expeditions/claim`: Body `{ expedition_id }`.
* `POST /user/ships/{id}/refuel`: Refuel ship (single-tier fuel, restore_per_unit=10).
* `POST /user/ships/{id}/repair`: Repair ship stability (single-tier repair, restore_per_unit=10).
* `POST /user/ships/{id}/equip`: Body `{ slot_index, artifact_id }` — equip artifact to slot.
* `POST /user/ships/{id}/unequip`: Body `{ slot_index }` — unequip artifact from slot.

### The Guide
* `GET /guide/chapters`: List all chapters with progress per user.
* `GET /guide/chapters/{chapter_id}`: Chapter detail with entries statuses.
* `POST /guide/research`: Body `{ chapter_id, entry_id }` — spend fragments to unlock an entry (may trigger glitch).
* `POST /guide/fix-glitch`: Body `{ chapter_id, entry_id }` — pay 2× fragment cost to fix a glitched entry.
* `POST /guide/claim-reward`: Body `{ chapter_id }` — claim the chapter reward artifact when all entries researched.

### User Events
* `POST /user/events`: Body `{ event_key }` — log a user action for dynamic chapter unlocks (e.g., `stare_60s`, `red_button_3x`).

### Content
* `GET /content/guide`: Load guide.json chapters/entries.

---

## 8. UI Design (Cockpit)

### Layout (mobile portrait, max 400px)
```
┌────────────────────────────┐
│  Avatar  Name   XP   XGEN  │  ← glassmorphism header
├────────────────────────────┤
│ [◉]  ┌──Ship Monitor──┐ [◉]│  ← circular slots (tier glow + dust)
│ [◉]  │  VEGA MK-II    │ [◉]│     overlap card edges
│ [◉]  │  grid + scan   │ [◉]│     lightning SVG between
│      │  line + SVG    │    │
│      └────────────────┘    │
│       [◉]  [◉]  [◉]       │  ← bottom slots
│                            │
│  ┌─ FUEL ████████░░ ─┐    │
│  └─ HP   ████████░░ ─┘    │  ← fuel + HP bars
│                            │
│  ┌─ Console (ПУЛЬТ) ────┐ │
│  │ [КАРТА] [ГРУЗ]       │ │  ← animated neon conic border
│  │ [ПУТЕВОДИТЕЛЬ] [РЫНОК]│ │
│  └──────────────────────┘ │
├────────────────────────────┤
│  🚀 Ангар │ 🌌 Карта │ ... │  ← bottom nav (transparent on cockpit)
└────────────────────────────┘
```

### Visual System
- **Background:** `radial-gradient(circle at center, #1a2a40 0%, #050505 100%)`
- **Glassmorphism:** `bg-white/5 backdrop-blur-[12px]` on all panels
- **Tier colors:** 1=gray #94a3b8, 2=green #22c55e, 3=purple #a855f7, 4=orange #f59e0b, 5=gold #ffd700
- **Slots:** circular, 44×44px, nebulous inner glow, floating dust particles
- **Buttons:** metallic bevel (border-t-white border-b-black), conic gradient animated border
- **Typography:** `font-mono` for HUD elements, Orbitron for display text

---

## 9. Development Guidelines for AI Agent
* **Type Safety:** Use Pydantic models for all Request/Response bodies. Use TypeScript interfaces for Frontend.
* **Error Handling:** Return standardized JSON errors `{ "code": "INSUFFICIENT_FUEL", "message": "..." }`.
* **No Hardcoding:** Never hardcode item stats in Python/TS code. Always read from `ContentLoader`.
* **Async/Await:** Use async DB calls (`supabase-py` async client or `asyncpg`).
* **Testing:** Write unit tests for `expedition_logic.py` and `guide_logic.py`.

---

## 10. Development Phases

### Phase 0 (DONE) — Cockpit UI
- [x] Single ship page (ShipPage.tsx) with Canvas starfield + particles
- [x] Circular artifact slots with tier-based rarity glow + space dust animation
- [x] Glassmorphism header (avatar, XP, XGEN)
- [x] Ship monitor (SVG VEGA MK-II) with grid, scan line, corner brackets
- [x] Lightning SVG effects between slots
- [x] Console panel with floating neon conic-gradient animated buttons
- [x] Fuel + HP bars (wired to real store data)
- [x] Bottom navigation with transparency on cockpit route
- [x] HudBar hidden on cockpit route (replaced by cockpit header)

### Phase 1 — Ship & Resource Simplification ✅
- [x] Reduce `ships.json` to single VEGA MK-II config
- [x] Single-tier fuel + repair kits (remove tier matching)
- [x] Limit user to one ship
- [x] 8 slot device inventory management (equip/unequip)

### Phase 2 — The Guide ✅
- [x] `guide.json` — 4 chapters (I, II, III + secret X), 29 entries with costs, texts, glitch chances, unlock events
- [x] GuidePage.tsx — chapter list → entry list → article detail with glitch display + reward claiming
- [x] Fragment economy: `balance_fragments` column, earn in expeditions, spend on research
- [x] Backend router `guide.py` — 5 endpoints: chapters list, chapter detail, research, fix-glitch, claim-reward
- [x] DB migration (00004_guide.sql) — `guide_progress`, `chapter_progress`, `user_events` tables
- [x] Dynamic chapters via `user_events` (stare_60s, red_button_3x, fuel_below_5, toggle_sound_5x, donated)
- [x] Glitch text mechanic — random on research, fixable at 2× cost, CSS glitch animation
- [x] Chapter reward artifacts (4 new equipables: Термос оптимизма, Словарь извинений, Синяя изолента, Очки вероятности)
- [x] Fragment loot in all zones (weighted, scales by tier)
- [x] Remove Lab, elements.json, recipe_generator, system.py, lab models, experiment_log

### Phase 3 — Expedition Refactor ✅
- [x] Single active expedition per user — backend checks for existing active expedition before allowing start
- [x] Fragment loot in zones — all 25 zones have fragments in loot_table
- [x] Artifact drops with chance in zones — T1 artifacts in random drops from boxes
- [x] Simplified expedition logic — `POST /expeditions/start` no longer requires `ship_id`, auto-selects user's first ship
- [x] Ship config fallback — if `ship_config_id` not found in content, uses `speed_mod: 1.0` default instead of 404
- [x] Launch button on ShipPage — navigates to /galaxy for zone selection
- [x] Expedition status on ShipPage — timer with progress bar during flight, claim button when complete
- [x] ZoneModal simplified — removed ship picker, auto-uses main ship, calcStats with fallback
- [x] `resources.json` — added `fragments` entry with `name_key: "Фрагменты бреда"` for proper display in zones/inventory
- [x] `/hangar` route removed — ShipPage is the only cockpit view

### Phase 4 — Cleanup ✅
- [x] Remove elements.json, old ships.json
- [x] Remove Lab components, experiment_log table, recipe_generator.py, system.py
- [x] Remove recipe_generator.py, experiment_log, lab router
- [x] Simplify Zustand store (remove experiment, lastExperiment, elementsContent)
- [x] Clean frontend types (remove Element, ExperimentResult, LabAttempts)
- [x] Update tests (boxes integrity — artifact drops instead of elements)
