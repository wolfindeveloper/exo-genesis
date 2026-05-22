-- EXO-GENESIS: Fix schema — TEXT ids instead of UUID, disable RLS
-- Run this in Supabase SQL Editor

-- 1. Drop dependent tables first (order matters for FK constraints)
DROP TABLE IF EXISTS discoveries CASCADE;
DROP TABLE IF EXISTS expeditions CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS user_ships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop ENUMs
DROP TYPE IF EXISTS expedition_status CASCADE;
DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS ship_status CASCADE;

-- 3. Recreate ENUMs
CREATE TYPE ship_status AS ENUM ('idle', 'expedition', 'repair');
CREATE TYPE item_type AS ENUM ('element', 'resource', 'artifact', 'consumable');
CREATE TYPE expedition_status AS ENUM ('active', 'completed', 'failed');

-- 4. Recreate tables with TEXT ids (Telegram user IDs are numeric strings)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT,
    language_code TEXT DEFAULT 'en',
    balance_xgen INTEGER DEFAULT 0,
    balance_stars INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ DEFAULT now(),
    streak_days INTEGER DEFAULT 0
);

CREATE TABLE user_ships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_config_id TEXT NOT NULL,
    status ship_status DEFAULT 'idle',
    stability FLOAT DEFAULT 100.0 CHECK (stability >= 0 AND stability <= 100),
    fuel_current INTEGER DEFAULT 0,
    equipped_artifacts JSONB DEFAULT '[]',
    acquired_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    item_config_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE expeditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_id UUID NOT NULL REFERENCES user_ships(id) ON DELETE CASCADE,
    zone_config_id TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ NOT NULL,
    status expedition_status DEFAULT 'active',
    result_data JSONB
);

CREATE TABLE discoveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_config_id TEXT NOT NULL,
    week_seed TEXT NOT NULL,
    discoverer_user_id TEXT NOT NULL REFERENCES users(id),
    discovered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (artifact_config_id, week_seed)
);

-- 5. Indexes
CREATE INDEX idx_user_ships_user_id ON user_ships(user_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_expeditions_user_id ON expeditions(user_id);
CREATE INDEX idx_expeditions_status ON expeditions(status);
CREATE INDEX idx_discoveries_week_seed ON discoveries(week_seed);

-- 6. RLS disabled — auth is handled by Telegram initData validation at app level
-- (No ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
