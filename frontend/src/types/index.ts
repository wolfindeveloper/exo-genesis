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
  description_key: string
  tier: number
  stats: { stability: number; fuel_capacity: number; speed_mod: number }
  required_level: number
  art_path: string
}

export interface Zone {
  id: string
  name_key: string
  description_key?: string
  tier: number
  risk_factor: number
  duration_hours: number
  fuel_cost: number
  icon_path: string
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
  balance_fragments?: number
  level: number
  xp: number
  streak_days: number
  streak_broken?: boolean
  daily_reward?: boolean
  daily_reward_items?: Record<string, number>
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

export interface Artifact {
  id: string
  name_key: string
  description_key?: string
  tier: number
  rarity: string
  stats_modifiers?: Record<string, number>
}

export interface Resource {
  id: string
  name_key: string
  description_key?: string
  tier: number
  resource_type: string
  icon_path: string
}

export interface UserStats {
  total_expeditions: number
  completed_expeditions: number
  failed_expeditions: number
  artifacts_crafted: number
  discoveries_made: number
  total_elements: number
  joined_days: number
}

export interface LootItem {
  item_config_id: string
  quantity: number
}

export interface ShipActionResponse {
  ship: Ship
  inventory: InventoryItem[]
}

export interface ClaimResult {
  status: string
  loot: LootItem[]
  ship_stability: number
  xp_gained?: number
  level?: number
  leveled_up?: boolean
}

export interface Rank {
  level: number
  title_key: string
  description_key: string
  icon_path: string
}

export interface GuideEntrySummary {
  id: string
  title: string
  fragment_cost: number
  status: 'locked' | 'researched' | 'glitched' | 'hidden'
  has_event?: boolean | null
  unlock_event?: string | null
}

export interface GuideChapterSummary {
  id: string
  title: string
  description: string
  order: number
  is_secret: boolean
  reward_artifact_id: string
  total_entries: number
  researched_count: number
  all_researched: boolean
  reward_claimed: boolean
  entries: GuideEntrySummary[]
}

export interface GuideChaptersResponse {
  chapters: GuideChapterSummary[]
}

export interface GuideEntryDetail extends GuideEntrySummary {
  text?: string | null
  glitch_chance?: number
}

export interface GuideChapterDetail {
  id: string
  title: string
  description: string
  is_secret: boolean
  reward_artifact_id: string
  total_entries: number
  researched_count: number
  all_researched: boolean
  reward_claimed: boolean
  entries: GuideEntryDetail[]
}

export interface GuideResearchResponse {
  status: string
  fixed: boolean
  balance_fragments: number
}

export interface GuideFixGlitchResponse {
  status: string
  balance_fragments: number
}

export interface GuideClaimRewardResponse {
  status: string
  artifact_id: string
  artifact_name: string
}
