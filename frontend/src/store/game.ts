import { create } from 'zustand'

import type { Artifact, Expedition, GuideChapterSummary, InventoryItem, LootItem, Rank, Resource, Ship, ShipConfig, UserProfile, UserStats, Zone } from '../types'
import { api } from '../api/client'

let _initStarted = false

interface GameState {
  user: UserProfile | null
  ships: Ship[]
  inventory: InventoryItem[]
  activeExpeditions: Expedition[]
  stats: UserStats | null
  shipsContent: ShipConfig[]
  zonesContent: Zone[]
  resourcesContent: Resource[]
  artifactsContent: Artifact[]
  ranksContent: Rank[]
  boxRewards: Record<string, unknown> | null
  pendingClaims: { shipId: string; shipName: string; fresh?: boolean }[]
  lastLoot: { shipName: string; loot: LootItem[]; shipStability: number } | null
  guideChapters: GuideChapterSummary[]
  isLoading: boolean
  isAuthReady: boolean
  isContentReady: boolean
  initFailed: boolean
  error: string | null

  initAuth: () => Promise<void>
  addPendingClaim: (shipId: string, shipName: string, fresh?: boolean) => void
  removePendingClaim: (shipId: string) => void
  clearLastLoot: () => void
  loadProfile: () => Promise<void>
  loadShips: () => Promise<void>
  loadInventory: () => Promise<void>
  loadActiveExpeditions: () => Promise<void>
  startExpedition: (zoneId: string) => Promise<void>
  claimExpedition: (expeditionId: string, shipName?: string) => Promise<void>
  refuelShip: (shipId: string, resourceId: string) => Promise<void>
  repairShip: (shipId: string, resourceId: string) => Promise<void>
  equipSlot: (shipId: string, slotIndex: number, artifactId: string) => Promise<void>
  unequipSlot: (shipId: string, slotIndex: number) => Promise<void>
  loadStats: () => Promise<void>
  loadContent: () => Promise<void>
  clearBoxRewards: () => void
  updateNickname: (username: string) => Promise<void>
  setUser: (user: UserProfile) => void
  loadGuideChapters: () => Promise<void>
  researchEntry: (chapterId: string, entryId: string) => Promise<void>
  fixGlitch: (chapterId: string, entryId: string) => Promise<void>
  claimGuideReward: (chapterId: string) => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  ships: [],
  inventory: [],
  activeExpeditions: [],
  stats: null,
  shipsContent: [],
  zonesContent: [],
  resourcesContent: [],
  artifactsContent: [],
  ranksContent: [],
  boxRewards: null,
  pendingClaims: [],
  lastLoot: null,
  guideChapters: [],
  isLoading: false,
  isAuthReady: false,
  isContentReady: false,
  initFailed: false,
  error: null,

  initAuth: async () => {
    if (_initStarted) return
    _initStarted = true
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        set({ isLoading: true, error: null, initFailed: false })
        const data = await api.authInit()
        const { is_new, box_rewards, ...rest } = data
        set({ user: rest as UserProfile, boxRewards: (box_rewards as Record<string, unknown>) || null, isLoading: false, isAuthReady: true })
        return
      } catch (e) {
        const isLast = attempt >= 4
        if (isLast) {
          set({ error: (e as Error).message, isLoading: false, initFailed: true })
          _initStarted = false
          return
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
    }
  },

  clearBoxRewards: () => {
    set({ boxRewards: null })
  },

  addPendingClaim: (shipId, shipName, fresh) => {
    set((s) => ({
      pendingClaims: s.pendingClaims.some((c) => c.shipId === shipId)
        ? s.pendingClaims
        : [...s.pendingClaims, { shipId, shipName, fresh }],
    }))
  },

  removePendingClaim: (shipId) => {
    set((s) => ({ pendingClaims: s.pendingClaims.filter((c) => c.shipId !== shipId) }))
  },

  clearLastLoot: () => {
    set({ lastLoot: null })
  },

  setUser: (user) => set({ user }),

  updateNickname: async (username: string) => {
    try {
      const updated = await api.updateProfile({ username })
      set({ user: updated })
    } catch (e) {
      console.warn('Failed to update nickname:', e)
    }
  },

  loadProfile: async () => {
    try {
      set({ isLoading: true, error: null })
      const user = await api.getProfile()
      set({ user, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  loadShips: async () => {
    try {
      const ships = await api.getShips()
      set({ ships })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  loadInventory: async () => {
    try {
      const inventory = await api.getInventory()
      set({ inventory })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  loadActiveExpeditions: async () => {
    try {
      const activeExpeditions = await api.getActiveExpeditions()
      set({ activeExpeditions })
    } catch {
      // non-critical
    }
  },

  startExpedition: async (zoneId) => {
    try {
      set({ isLoading: true, error: null })
      const expedition = await api.startExpedition(zoneId)
      set({ activeExpeditions: [...get().activeExpeditions, expedition], isLoading: false })
      await get().loadShips()
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  refuelShip: async (shipId, resourceId) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.refuelShip(shipId, resourceId)
      set({ ships: get().ships.map((s) => (s.id === shipId ? result.ship : s)), inventory: result.inventory, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  repairShip: async (shipId, resourceId) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.repairShip(shipId, resourceId)
      set({ ships: get().ships.map((s) => (s.id === shipId ? result.ship : s)), inventory: result.inventory, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  equipSlot: async (shipId, slotIndex, artifactId) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.equipSlot(shipId, slotIndex, artifactId)
      set({ ships: get().ships.map((s) => (s.id === shipId ? result.ship : s)), inventory: result.inventory, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  unequipSlot: async (shipId, slotIndex) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.unequipSlot(shipId, slotIndex)
      set({ ships: get().ships.map((s) => (s.id === shipId ? result.ship : s)), inventory: result.inventory, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  claimExpedition: async (expeditionId, shipName) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.claimExpedition(expeditionId)
      set({
        activeExpeditions: get().activeExpeditions.filter((e) => e.id !== expeditionId),
        lastLoot: { shipName: shipName || 'Корабль', loot: result.loot, shipStability: result.ship_stability },
        isLoading: false,
      })
      await Promise.all([get().loadShips(), get().loadInventory()])
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  loadStats: async () => {
    try {
      const stats = await api.getStats()
      set({ stats })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  loadContent: async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        set({ initFailed: false })
        const [shipsContent, zonesContent, resourcesContent, artifactsContent, ranksContent] = await Promise.all([
          api.getShipsContent(),
          api.getZonesContent(),
          api.getResourcesContent(),
          api.getArtifactsContent(),
          api.getRanksContent(),
        ])
        set({ shipsContent, zonesContent, resourcesContent, artifactsContent, ranksContent, isContentReady: true })
        return
      } catch (e) {
        const isLast = attempt >= 4
        if (isLast) {
          console.warn('Content load failed after 5 attempts:', e)
          set({ error: (e as Error).message, initFailed: true })
          return
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
    }
  },

  loadGuideChapters: async () => {
    try {
      const data = await api.getGuideChapters()
      set({ guideChapters: data.chapters })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  researchEntry: async (chapterId, entryId) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.researchEntry(chapterId, entryId)
      set((s) => ({
        isLoading: false,
        user: s.user ? { ...s.user, balance_fragments: result.balance_fragments } : null,
      }))
      await get().loadGuideChapters()
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  fixGlitch: async (chapterId, entryId) => {
    try {
      set({ isLoading: true, error: null })
      const result = await api.fixGlitch(chapterId, entryId)
      set((s) => ({
        isLoading: false,
        user: s.user ? { ...s.user, balance_fragments: result.balance_fragments } : null,
      }))
      await get().loadGuideChapters()
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  claimGuideReward: async (chapterId) => {
    try {
      set({ isLoading: true, error: null })
      await api.claimReward(chapterId)
      set({ isLoading: false })
      await Promise.all([get().loadGuideChapters(), get().loadInventory()])
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },
}))
