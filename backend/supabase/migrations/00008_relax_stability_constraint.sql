-- Migration 00008: Relax stability CHECK constraint to allow artifact bonuses
-- Artifacts can increase effective max_stability beyond 100

ALTER TABLE user_ships DROP CONSTRAINT IF EXISTS user_ships_stability_check;

ALTER TABLE user_ships ADD CONSTRAINT user_ships_stability_check
  CHECK (stability >= 0 AND stability <= 200);
