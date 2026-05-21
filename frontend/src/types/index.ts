export interface Ship {
  id: string
  user_id: string
  ship_config_id: string
  status: 'idle' | 'expedition' | 'repair'
  stability: number
  fuel_current: number
  equipped_artifacts: string[]
  acquired_at: string
}

export interface ShipConfig {
  id: string
  name_key: string
  tier: number
  stats: { stability: number; fuel_capacity: number; speed_mod: number }
  required_level: number
  art_path: string
}

export interface Zone {
  id: string
  name_key: string
  tier: number
  risk_factor: number
  duration_hours: number
  fuel_cost: number
  loot_table: LootEntry[]
}

export interface LootEntry {
  item_id: string
  weight: number
  min: number
  max: number
}

export interface UserProfile {
  id: string
  username: string | null
  language_code: string
  balance_xgen: number
  balance_stars: number
  level: number
  xp: number
  streak_days: number
}

export interface InventoryItem {
  id: string
  item_type: string
  item_config_id: string
  quantity: number
  metadata: Record<string, unknown>
}

export interface Expedition {
  id: string
  user_id: string
  ship_id: string
  zone_config_id: string
  start_time: string
  end_time: string
  status: string
  result_data: Record<string, unknown> | null
}

export interface ExperimentResult {
  success: boolean
  artifact_id: string | null
  artifact_name_key: string | null
  artifact_tier: number | null
  artifact_rarity: string | null
  stats_modifiers: Record<string, unknown> | null
  is_first_discoverer: boolean
  xp_gained: number
}
