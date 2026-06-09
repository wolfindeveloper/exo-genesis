export interface EffectiveStats {
  max_stability: number
  max_fuel: number
  speed_mod: number
  total_stability_bonus: number
  total_speed_bonus: number
  total_fuel_efficiency: number
}

export interface Ship {
  id: string
  user_id: string
  ship_config_id: string
  status: 'idle' | 'expedition' | 'repair'
  stability: number
  fuel_current: number
  equipped_artifacts: string[]
  acquired_at: string
  resolved_artifacts?: (Artifact | null)[]
  effective_stats?: EffectiveStats
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
  icon_path?: string
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
  joined_days: number
  total_xp_earned: number
  zones_explored: number
  equipped_artifacts_count: number
  unique_artifacts: number
  resources: { fuel: number; repair_kits: number }
  guide_progress: { total_chapters: number; completed_chapters: number; entries_researched: number }
  recent_expeditions: {
    id: string
    zone_config_id: string
    status: string
    end_time: string | null
    loot_summary: string | null
  }[]
  glitches_fixed: number
  total_purchases: number
}

export interface AchievementStatus {
  achievement_id: string
  claimed: boolean
  claimed_at: string | null
}

export interface ClaimAchievementResponse {
  status: string
  achievement_id: string
  xp_gained: number
  xgen_gained: number
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

export interface LootResult {
  shipName: string
  loot: LootItem[]
  shipStability: number
  xpGained?: number
  level?: number
  leveledUp?: boolean
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

export interface ShopItem {
  id: string
  category: string
  name_key: string
  description_key: string
  price: { amount: number; currency: 'xgen' | 'stars' }
  rewards: { type: string; quantity?: number; tier?: number; item_type?: string; item_config_id?: string }[]
  icon_path?: string
  tier?: number
  rarity?: string
  stats_modifiers?: Record<string, number>
  type?: string
}

export interface ShopGrantedItem {
  type: string
  item_config_id?: string
  quantity?: number
  tier?: number
  name_key?: string
}

export interface ShopBuyResponse {
  status: string
  granted: ShopGrantedItem[]
  balance_xgen: number
  balance_stars: number
}
