import { create } from 'zustand'

import type { Artifact, Element, Expedition, ExperimentResult, InventoryItem, LootItem, Rank, Resource, Ship, ShipConfig, UserProfile, UserStats, Zone } from '../types'
import { api } from '../api/client'

let _initStarted = false

interface GameState {
  user: UserProfile | null
  ships: Ship[]
  inventory: InventoryItem[]
  activeExpeditions: Expedition[]
  lastExperiment: ExperimentResult | null
  stats: UserStats | null
  shipsContent: ShipConfig[]
  zonesContent: Zone[]
  elementsContent: Element[]
  resourcesContent: Resource[]
  artifactsContent: Artifact[]
  ranksContent: Rank[]
  boxRewards: Record<string, unknown> | null
  pendingClaims: { shipId: string; shipName: string; fresh?: boolean }[]
  lastLoot: { shipName: string; loot: LootItem[]; shipStability: number } | null
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
  startExpedition: (shipId: string, zoneId: string) => Promise<void>
  claimExpedition: (expeditionId: string, shipName?: string) => Promise<void>
  refuelShip: (shipId: string, resourceId: string) => Promise<void>
  repairShip: (shipId: string, resourceId: string) => Promise<void>
  experiment: (elementIds: string[]) => Promise<void>
  loadStats: () => Promise<void>
  loadContent: () => Promise<void>
  clearBoxRewards: () => void
  updateNickname: (username: string) => Promise<void>
  setUser: (user: UserProfile) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  ships: [],
  inventory: [],
  activeExpeditions: [],
  lastExperiment: null,
  stats: null,
  shipsContent: [],
  zonesContent: [],
  elementsContent: [],
  resourcesContent: [],
  artifactsContent: [],
  ranksContent: [],
  boxRewards: null,
  pendingClaims: [],
  lastLoot: null,
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

  startExpedition: async (shipId, zoneId) => {
    try {
      set({ isLoading: true, error: null })
      const expedition = await api.startExpedition(shipId, zoneId)
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

  experiment: async (elementIds) => {
    try {
      set({ isLoading: true, error: null, lastExperiment: null })
      const result = await api.experiment(elementIds)
      set({ lastExperiment: result, isLoading: false })
      await get().loadInventory()
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
        const [shipsContent, zonesContent, elementsContent, resourcesContent, artifactsContent, ranksContent] = await Promise.all([
          api.getShipsContent(),
          api.getZonesContent(),
          api.getElementsContent(),
          api.getResourcesContent(),
          api.getArtifactsContent(),
          api.getRanksContent(),
        ])
        set({ shipsContent, zonesContent, elementsContent, resourcesContent, artifactsContent, ranksContent, isContentReady: true })
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
}))
