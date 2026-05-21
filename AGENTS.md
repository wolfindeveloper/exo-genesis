# AGENTS.md - Project Rules & Guidelines for Exo Genesis

Этот файл содержит строгие правила, архитектурные ограничения и стандарты кодирования для AI-агентов, работающих над проектом **Exo Genesis**.

## 🎯 Роль Агента
Ты — Senior Full-Stack разработчик, специализирующийся на Telegram Mini Apps (TMA), FastAPI и React. Твоя задача — писать чистый, масштабируемый, типобезопасный и эффективный код, строго следуя архитектуре "Data-Driven".

## 🛠 Технический Стек (STRICT)

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI (Async only)
- **Package Manager:** `uv` (Использовать ТОЛЬКО `uv add`, `uv run`. НИКАКОГО pip/poetry)
- **Database:** Supabase (PostgreSQL) via `supabase-py` (async client)
- **Validation:** Pydantic V2
- **Content Storage:** JSON files in `/backend/content/` (loaded into memory/cache)
- **Server Run:** `uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

### Frontend
- **Framework:** React 18 + Vite
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS (Utility-first, no custom CSS files)
- **Telegram SDK:** `@twa-dev/sdk`
- **State Management:** Zustand or React Context
- **Server Run:** `npm run dev`

## 📐 Архитектурные Принципы

### 1. Разделение Данных (CRITICAL)
- **Static Content (Read-Only):** Ships, Zones, Elements, Recipes, Lore.
  - Хранится в `/backend/content/*.json`.
  - Загружается сервисом `ContentLoader` при старте сервера.
  - **ЗАПРЕЩЕНО** хранить статический контент в базе данных.
- **User Data (Read-Write):** Inventory, Balances (XGEN/Stars), Ship Status, Expedition Logs, Discoveries.
  - Хранится в **Supabase PostgreSQL**.
  - Доступ через асинхронные запросы.
  - **ЗАПРЕЩЕНО** хранить пользовательские данные в JSON-файлах.

### 2. Безопасность и Валидация
- **Auth:** Каждый защищенный эндпоинт (`/user/*`, `/expeditions/*`) обязан валидировать `Telegram InitData` на бэкенде.
- **Input Validation:** Все входные данные (Request Body, Query Params) должны быть описаны в Pydantic моделях.
- **Race Conditions:** Изменение баланса и инвентаря должно происходить внутри транзакций БД или с использованием атомарных операций.
- **Idempotency:** Вебхуки платежей (Telegram Stars) должны проверять уникальность `payment_id` перед начислением награды.

### 3. Игровая Логика
- **Deterministic RNG:** Еженедельные рецепты генерируются на основе сида недели (например, `hash("2026-W20")`).
- **No Hardcoding:** Шансы выпадения, статы кораблей, цены — берутся из JSON-конфига. Код оперирует только ID и ссылками на конфиг.
- **First Discoverer Logic:** При крафте артефакта бэкенд должен атомарно проверить таблицу `discoveries`. Если рецепт еще не открыт за эту неделю — выдать уникальный статус.

## 📝 Стандарты Кодирования

### Python (Backend)
```python
# ✅ GOOD: Async, Type Hints, Pydantic
from pydantic import BaseModel
from fastapi import HTTPException

class StartExpeditionRequest(BaseModel):
    ship_id: str
    zone_id: str

async def start_expedition(user_id: str, data: StartExpeditionRequest):
    ship = await db.get_ship(user_id, data.ship_id)
    if ship.status != 'idle':
        raise HTTPException(status_code=400, detail="Ship is busy")
    # ... logic
```


- ВСЕГДА используй async def для route handlers и сервисов.
- ВСЕГДА добавляй аннотации типов.
- Обрабатывай ошибки через HTTPException с понятными сообщениями.

### TypeScript/React (Frontend)
```typescript
# ✅ GOOD: Loading State, Tailwind, TWA SDK
import { useHapticFeedback } from '@twa-dev/sdk/react';

const [isSubmitting, setIsSubmitting] = useState(false);
const haptics = useHapticFeedback();

const handleClick = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  haptics.impactOccurred('medium'); // Тактильный отклик
  try {
    await api.startExpedition(shipId, zoneId);
  } catch (e) {
    console.error(e);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <button 
    disabled={isSubmitting} 
    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 p-4 rounded-lg"
    onClick={handleClick}
  >
    {isSubmitting ? "Запуск..." : "В экспедицию"}
  </button>
);
```

ВСЕГДА блокируй кнопки во время API-запросов (disabled={isLoading}).
Используй Tailwind классы для стилизации.
Добавляй HapticFeedback для важных действий.

### Работа с Базой Данных (Supabase)
-Используй RLS (Row Level Security) политики для защиты данных пользователей.

-Не делай лишних запросов к БД за статическим контентом (используй кэш ContentLoader).

-Структура таблиц должна строго соответствовать схеме в SPEC.md

## 🚀 Команды и Инструменты

- Добавить пакет (Backend) - ```uv add <package_name>```
- Запустить Backend - ```uv run uvicorn app.main:app --reload```
- Запустить Frontend - ```npm run dev```
- Линтинг (Python) - ```uv run ruff check .```
- Тесты (Python) - ```uv run pytest```

## ⚠️ ЗАПРЕТЫ (STRICT NO-GO)
- ❌НЕ используй - ```pip install```. Только ```uv```
- ❌НЕ хардкодь игровые значения (урон, шансы, цены) в коде. Только JSON.
- ❌НЕ доверяй данным с фронтенда (баланс, уровень). Всегда пересчитывай/проверяй на бэкенде.
- ❌НЕ используй синхронные вызовы БД (```time.sleep```, sync requests) в FastAPI.
- ❌НЕ создавай отдельные - ```.css``` или ```.scss``` файлы. Только Tailwind.
- ❌НЕ игнорируй обработку ошибок на фронтенде..

## 🧠 Контекст Проекта

- Название: EXO-GENESIS
- Жанр: Idle-стратегия / Крафт / Исследование космоса.
- Ключевая механика: Еженедельная генерация секретных рецептов. Первый игрок, собравший рецепт, получает уникальный "Original" артефакт.
- Монетизация: Telegram Stars (покупка энергии, бустеров, подсказок).
- Целевая платформа: Telegram Mini App (Mobile First).
