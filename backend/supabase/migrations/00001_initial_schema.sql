-- EXO-GENESIS: Initial Schema
-- Run this in Supabase SQL Editor

-- 1. ENUMs
CREATE TYPE ship_status AS ENUM ('idle', 'expedition', 'repair');
CREATE TYPE item_type AS ENUM ('element', 'resource', 'artifact', 'consumable');
CREATE TYPE expedition_status AS ENUM ('active', 'completed', 'failed');

-- 2. Tables
CREATE TABLE users (
    id UUID PRIMARY KEY,
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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ship_config_id TEXT NOT NULL,
    status ship_status DEFAULT 'idle',
    stability FLOAT DEFAULT 100.0 CHECK (stability >= 0 AND stability <= 100),
    fuel_current INTEGER DEFAULT 0,
    equipped_artifacts JSONB DEFAULT '[]',
    acquired_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    item_config_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE expeditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    discoverer_user_id UUID NOT NULL REFERENCES users(id),
    discovered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (artifact_config_id, week_seed)
);

-- 3. Indexes
CREATE INDEX idx_user_ships_user_id ON user_ships(user_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_expeditions_user_id ON expeditions(user_id);
CREATE INDEX idx_expeditions_status ON expeditions(status);
CREATE INDEX idx_discoveries_week_seed ON discoveries(week_seed);

-- 4. Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_rows ON users
    USING (id = auth.uid()::UUID);

CREATE POLICY user_own_ships ON user_ships
    USING (user_id = auth.uid()::UUID);

CREATE POLICY user_own_inventory ON user_inventory
    USING (user_id = auth.uid()::UUID);

CREATE POLICY user_own_expeditions ON expeditions
    USING (user_id = auth.uid()::UUID);

CREATE POLICY discoveries_read_all ON discoveries
    FOR SELECT USING (true);
