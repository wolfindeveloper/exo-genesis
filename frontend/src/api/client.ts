import type { Artifact, ClaimResult, Expedition, GuideChapterDetail, GuideChaptersResponse, GuideClaimRewardResponse, GuideFixGlitchResponse, GuideResearchResponse, InventoryItem, Rank, Resource, Ship, ShipActionResponse, ShopBuyResponse, ShopItem, UserProfile, UserStats, ShipConfig, Zone } from '../types'
import { getInitData } from '../lib/telegram'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const initData = getInitData()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(initData ? { Authorization: `tma ${initData}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  authInit: () =>
    request<UserProfile & { is_new?: boolean; box_rewards?: Record<string, unknown> }>('/user/profile'),

  getProfile: () => request<UserProfile>('/user/profile'),

  getInventory: () => request<InventoryItem[]>('/user/inventory'),

  getShips: () => request<Ship[]>('/user/ships'),

  getActiveExpeditions: () => request<Expedition[]>('/expeditions/active'),

  startExpedition: (zone_id: string) =>
    request<Expedition>('/expeditions/start', {
      method: 'POST',
      body: JSON.stringify({ zone_id }),
    }),

  claimExpedition: (expedition_id: string) =>
    request<ClaimResult>(
      '/expeditions/claim',
      {
        method: 'POST',
        body: JSON.stringify({ expedition_id }),
      },
    ),

  getStats: () => request<UserStats>('/user/stats'),

  updateProfile: (data: { username?: string; add_xgen?: number }) =>
    request<UserProfile>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  refuelShip: (shipId: string, resourceId: string) =>
    request<ShipActionResponse>(`/user/ships/${shipId}/refuel`, {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId }),
    }),

  repairShip: (shipId: string, resourceId: string) =>
    request<ShipActionResponse>(`/user/ships/${shipId}/repair`, {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId }),
    }),

  equipSlot: (shipId: string, slotIndex: number, artifactId: string) =>
    request<ShipActionResponse>(`/user/ships/${shipId}/equip`, {
      method: 'POST',
      body: JSON.stringify({ slot_index: slotIndex, artifact_id: artifactId }),
    }),

  unequipSlot: (shipId: string, slotIndex: number) =>
    request<ShipActionResponse>(`/user/ships/${shipId}/unequip`, {
      method: 'POST',
      body: JSON.stringify({ slot_index: slotIndex }),
    }),

  getShipsContent: () => request<ShipConfig[]>('/content/ships'),
  getZonesContent: () => request<Zone[]>('/content/zones'),
  getResourcesContent: () => request<Resource[]>('/content/resources'),
  getArtifactsContent: () => request<Artifact[]>('/content/artifacts'),
  getRanksContent: () => request<Rank[]>('/content/ranks'),

  getGuideChapters: () => request<GuideChaptersResponse>('/guide/chapters'),

  getGuideChapter: (chapterId: string) => request<GuideChapterDetail>(`/guide/chapters/${chapterId}`),

  researchEntry: (chapterId: string, entryId: string) =>
    request<GuideResearchResponse>('/guide/research', {
      method: 'POST',
      body: JSON.stringify({ chapter_id: chapterId, entry_id: entryId }),
    }),

  fixGlitch: (chapterId: string, entryId: string) =>
    request<GuideFixGlitchResponse>('/guide/fix-glitch', {
      method: 'POST',
      body: JSON.stringify({ chapter_id: chapterId, entry_id: entryId }),
    }),

  claimReward: (chapterId: string) =>
    request<GuideClaimRewardResponse>('/guide/claim-reward', {
      method: 'POST',
      body: JSON.stringify({ chapter_id: chapterId }),
    }),

  logEvent: (eventKey: string) =>
    request<{ status: string }>('/user/events', {
      method: 'POST',
      body: JSON.stringify({ event_key: eventKey }),
    }),

  getShopCatalog: () => request<ShopItem[]>('/shop/catalog'),

  buyShopItem: (itemId: string) =>
    request<ShopBuyResponse>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    }),
}
