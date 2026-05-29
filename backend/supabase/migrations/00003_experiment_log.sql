-- EXO-GENESIS: Experiment Log for Lab fail history
-- Run this in Supabase SQL Editor

CREATE TABLE experiment_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_key TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_experiment_log_user_id ON experiment_log(user_id);
CREATE INDEX idx_experiment_log_recipe ON experiment_log(user_id, recipe_key);

ALTER TABLE experiment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_experiment_log ON experiment_log
    USING (user_id = auth.uid()::UUID);
