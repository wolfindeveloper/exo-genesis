# EXO-GENESIS — Context & Decisions

## Деплой (план на будущее)

### Frontend → Vercel
```bash
cd frontend
npm run build          # tsc -b && vite build → dist/
```
- Подключить репозиторий к Vercel (или залить `dist/` вручную)
- `vercel.json` уже настроен: SPA rewrites для React Router
- CORS уже разрешает `https://exo-genesis.vercel.app`

### Backend → HostingGuru
- Загрузить `backend/` на сервер (git pull / sftp)
- Установить зависимости: `uv sync` или `pip install -r requirements.txt`
- Создать `backend/.env.prod`:
  ```ini
  SUPABASE_URL=https://wirjlwytqgcrqtkbvrli.supabase.co
  SUPABASE_KEY=<prod-key>
  BOT_TOKEN=<prod-token>
  FRONTEND_URL=https://exo-genesis.vercel.app
  DEBUG=false
  WEBHOOK_URL=https://backend.production.com/webhook
  ```
- Запуск: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Настроить автозапуск (systemd / tmux / supervisor)

### Telegram Webhook (вместо polling)
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://backend.production.com/webhook"
```

### После деплоя
- Проверить CORS: фронтенд → бекенд
- Проверить initData валидацию (HMAC/Ed25519, 24h freshness)
- Проверить регистрацию нового пользователя (стартовый набор)
- Проверить экспедиции, инвентарь, корабли

---

## Стартовый набор (вместо бокса)

**Решение (2026-06-04):** Убрали `open_box("nothing_extra_starter_pack")` при регистрации.
Новый игрок получает напрямую:
- Корабль `vega_mk2` (100% прочности) в `user_ships`
- `fuel` ×20 в `user_inventory`
- `repair_kit` ×5 в `user_inventory`
- `balance_xgen` +10

См. `_grant_starter_pack()` в `backend/app/routers/user.py`.

---

## Отложенные задачи (medium/low)
- `balance_xgen` → `int()` при получении из Supabase (защита от строк)
- BoxReveal: клиент читает `item_id` сервера, а не перевыбирает из `pool`
- Придумать онбординг вместо BoxReveal для новых игроков

---

## Settings — UI Настроек (план)

**Решение (2026-06-04):** Добавить кнопку ⚙️ в NavBar, открывает `SettingsSheet` — bottom sheet с настройками.

### Архитектура
- **Стор:** Расширить `GameState` → `settings: { language: 'ru' | 'en' | 'ua', musicEnabled: boolean }`
- **Персист:** `localStorage` (не требует бекенда)
- **i18n:** Кастомный хук `useTranslate()` + словари в `lib/i18n.ts` (RU/EN/UA)
- **Аудио:** `HTMLAudioElement` в `lib/audio.ts`, один трек с loop
- **UI:** `components/SettingsSheet.tsx` — bottom sheet с секциями (язык, музыка)

### Структура SettingsSheet
```typescript
// Каждая настройка — элемент массива. Добавление новой = +1 элемент.
sections = [
  {
    title: 'Язык',
    items: [{ type: 'select', options: ['RU','EN','UA'], value: language }]
  },
  {
    title: 'Музыка',
    items: [
      { type: 'toggle', key: 'musicEnabled', value: musicEnabled },
      // сюда же позже: { type: 'music_track', tracks: [...], current: trackId }
    ]
  },
  // место для будущих секций
]
```

### NavBar — редизайн
- Только активная кнопка показывает текст (слева от иконки)
- Остальные — только иконки
- 6 кнопок: Ангар | Гайд | Карта | Инв | Проф | ⚙️

### Музыкальный трек
- Файл: `public/music/technological_integration.mp3`
- Атрибуция (CC BY 4.0):
  > "Technological Integration (La Integración de la Tecnología)" — Cyberpunk / Darksynth Metal Instrumental  
  > by David J. Barrios — Free Music Archive — CC BY 4.0
- Кредиты показывать под переключателем музыки в SettingsSheet

### План реализации
1. `lib/i18n.ts` — словари RU/EN/UA + `t(key, lang)`
2. `hooks/useTranslate.ts` — возвращает `t()` из стора
3. `lib/audio.ts` — `initAudio()`, `playMusic()`, `stopMusic()`, `MUSIC_TRACKS`
4. `store/game.ts` — расширить: `settings` slice + экшены
5. `components/SettingsSheet.tsx` — bottom sheet
6. `App.tsx` — NavBar редизайн + кнопка ⚙️ + initAudio
7. Постепенная замена строк на `t()` во всех компонентах
