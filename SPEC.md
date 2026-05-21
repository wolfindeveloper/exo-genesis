```markdown
# Project Specification: EXO-GENESIS (Telegram Mini App)

## 1. Overview
**Exo-Genesis** is a space-themed idle/exploration game with crafting mechanics, built as a Telegram Mini App (TMA).

* **Core Loop:** Players send ships on expeditions $\rightarrow$ collect resources/elements $\rightarrow$ combine elements in a Lab to discover unique Artifacts $\rightarrow$ mint rare Artifacts as NFTs (optional/late stage).
* **Key Feature:** *"First Discoverer"* mechanic. Recipes are generated weekly. The first player to craft a specific artifact owns the "Original" version. Subsequent crafts yield standard versions or fail.

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
* **Framework:** React 18 + Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **State Management:** Zustand or React Context
* **Telegram Integration:** `@twa-dev/sdk`
* **UI Components:** Custom components with Tailwind. Animations via Framer Motion (optional).

### Infrastructure
* **Hosting:**
    * **Frontend:** Vercel / Cloudflare Pages
    * **Backend:** Render / Railway / Docker container
* **Environment Variables:** `.env` for secrets (Supabase URL/Key, Bot Token, JWT Secret).

---

## 3. Architecture Principles

### 3.1 Data Separation (Crucial)
* **Static Content (Read-Only):** Ships, Zones, Elements, Artifact Definitions, Weekly Recipes.
    * Stored in `/content/*.json`.
    * Loaded by `ContentLoader` service at startup.
    * Cached in memory (`lru_cache` or global dict).
    * **NEVER** store static content in DB.
* **User Data (Read-Write):** Inventory, Balance, Ship Status, Expedition Logs, Discovery History.
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
| `id` | UUID | Primary Key (Telegram User ID) |
| `username` | TEXT | |
| `language_code` | TEXT | e.g., `'en'`, `'ru'` |
| `balance_xgen` | INTEGER | Default: `0` |
| `balance_stars` | INTEGER | Default: `0` (synced with Telegram Payments) |
| `level` | INTEGER | Default: `1` |
| `xp` | INTEGER | Default: `0` |
| `created_at` | TIMESTAMPTZ | |
| `last_login` | TIMESTAMPTZ | |
| `streak_days` | INTEGER | |

#### `user_ships`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key $\rightarrow$ `users.id` |
| `ship_config_id` | TEXT | References `ships.json` ID |
| `status` | ENUM | `'idle'`, `'expedition'`, `'repair'` |
| `stability` | FLOAT | `0.0` - `100.0` |
| `fuel_current` | INTEGER | |
| `equipped_artifacts` | JSONB | Array of artifact IDs |
| `acquired_at` | TIMESTAMPTZ | |

#### `user_inventory`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key $\rightarrow$ `users.id` |
| `item_type` | ENUM | `'element'`, `'resource'`, `'artifact'`, `'consumable'` |
| `item_config_id` | TEXT | References JSON config ID |
| `quantity` | INTEGER | |
| `metadata` | JSONB | For unique artifacts (e.g., `{"discovered_by": "user_id", "is_original": true}`) |

#### `expeditions`
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key $\rightarrow$ `users.id` |
| `ship_id` | UUID | Foreign Key $\rightarrow$ `user_ships.id` |
| `zone_config_id` | TEXT | References `zones.json` ID |
| `start_time` | TIMESTAMPTZ | |
| `end_time` | TIMESTAMPTZ | |
| `status` | ENUM | `'active'`, `'completed'`, `'failed'` |
| `result_data` | JSONB | Loot table result (nullable until completed) |

#### `discoveries` (Global Registry)
| Column Name | Data Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `artifact_config_id` | TEXT | The recipe ID |
| `week_seed` | TEXT | The week identifier (e.g., `"2026-W20"`) |
| `discoverer_user_id` | UUID | Foreign Key $\rightarrow$ `users.id` |
| `discovered_at` | TIMESTAMPTZ | |

> **Constraint:** Unique index on `(artifact_config_id, week_seed)` to ensure only one discoverer per week per recipe.

---

## 5. Content Structure (JSON)
All JSON files reside in `/backend/content/`.

### `ships.json`
```json

[
  {
    "id": "ship_t1_scout",
    "name_key": "ship_scout_name",
    "tier": 1,
    "stats": { "stability": 100, "fuel_capacity": 50, "speed_mod": 1.0 },
    "art_path": "/assets/ships/t1_scout.webp"
  }
]

### `ships.json`

[
  {
    "id": "zone_nebula_alpha",
    "name_key": "zone_nebula_name",
    "tier": 1,
    "risk_factor": 0.1,
    "loot_table": [
      { "item_id": "elem_iron", "weight": 50, "min": 1, "max": 3 },
      { "item_id": "fuel_refined", "weight": 30, "min": 5, "max": 10 }
    ],
    "duration_hours": 12
  }
]

# recipes_weekly.json (Generated)
Generated by backend script every Monday 00:00 UTC.

**Format:** `{ "week_seed": "2026-W20", "recipes": { "artifact_id_1": ["elem_a", "elem_b"], ... } }`

## 6. Core Business Logic

### 6.1 Expedition Logic

#### Start:
1. Check ship status == `'idle'`.
2. Check fuel $\ge$ required.
3. Deduct fuel.
4. Set ship status = `'expedition'`.
5. Create expeditions record with `end_time = now() + duration`.

#### Complete:
* Triggered by cron job or user claim.
* Calculate loot based on `zone.loot_table` + ship modifiers + RNG.
* Update ship status to `'idle'`.
* Add loot to `user_inventory`.
* Apply damage to ship stability based on `zone.risk_factor`.

### 6.2 Lab (Crafting) Logic

#### Experiment:
1. User selects $N$ elements.
2. Check daily free attempts limit (e.g., 5). If exceeded, require payment (Stars/XGEN).
3. Decrement attempt counter.
4. Get current week's recipes from `ContentLoader`.
5. Check discoveries table: *Has this recipe been found this week?*
   * **If NOT found:**
     * If user's combination matches recipe:
       * Mark as discovered in discoveries table (**Atomic Transaction!**).
       * Grant "Original" Artifact (NFT-ready metadata).
       * Broadcast "First Discoverer" event.
     * Else:
       * Grant random common resource or nothing.
   * **If ALREADY found:**
     * Small chance to craft standard version.
     * Mostly fail or give scraps.

### 6.3 Monetization (Telegram Stars)
* Endpoints for purchasing: Energy Refill, Instant Finish, Extra Lab Attempts.
* Webhook handler verifies Telegram payment signature and updates `users.balance_stars` or grants items.

---

## 7. API Endpoints (FastAPI)

### Auth
* `POST /auth/validate`: Validate Telegram InitData, return/create user profile.

### User Profile
* `GET /user/profile`: Get stats, balances, level.
* `GET /user/inventory`: List items.
* `GET /user/ships`: List ships with status.

### Gameplay
* `POST /expeditions/start`: Body `{ ship_id, zone_id }`.
* `POST /expeditions/claim`: Body `{ expedition_id }`.
* `POST /lab/experiment`: Body `{ element_ids: [] }`.
* `GET /lab/recipes/hint`: Paid endpoint, returns partial info about current week's recipes.

### Admin/System
* `GET /system/week-info`: Current week seed, remaining time.
* `POST /admin/generate-recipes`: Manual trigger for testing.

---

## 8. Development Guidelines for AI Agent
* **Type Safety:** Use Pydantic models for all Request/Response bodies. Use TypeScript interfaces for Frontend.
* **Error Handling:** Return standardized JSON errors `{ "code": "INSUFFICIENT_FUEL", "message": "..." }`.
* **Logging:** Log all critical actions (crafting, expedition start) with User ID for debugging.
* **No Hardcoding:** Never hardcode item stats in Python/TS code. Always read from `ContentLoader`.
* **Async/Await:** Use async DB calls (`supabase-py` async client or `asyncpg`).
* **Testing:** Write unit tests for `recipe_generator.py` and `expedition_logic.py`.

---

## 9. Immediate Next Steps (MVP)
1. Setup Supabase project and run SQL migration for schema.
2. Create `content/` folder with dummy JSONs for 5 ships, 5 zones, 10 elements.
3. Implement `ContentLoader` in FastAPI.
4. Implement `/auth/validate` and User Creation.
5. Implement `/expeditions/start` and `/claim`.
6. Build React UI for Hangar (Ship list) and Galaxy (Zone selection).


# Environment Management
- Use `uv` for all Python dependency management.
- To add a package: `uv add <package_name>`
- To run scripts: `uv run <script.py>`
- To run server: `uv run uvicorn app.main:app --reload`
- Do NOT use `pip` or `poetry`.
- Virtual environment is located at `backend/.venv`.



Привет! Мы начинаем разработку проекта EXO-GENESIS.
Стек: Windows, uv, FastAPI, React, Supabase.

1. Создай структуру папок для backend/ согласно SPEC.md.
2. Создай файл backend/pyproject.toml с зависимостями: fastapi, uvicorn, supabase, pydantic, python-dotenv.
3. Создай базовый файл backend/app/main.py с простым эндпоинтом /health, который возвращает {"status": "ok"}.
4. Создай папку backend/content/ и положи туда пустой ships.json с примером одной записи.
5. Напиши инструкцию, как запустить этот сервер через uv run.

Используй лучшие практики FastAPI.