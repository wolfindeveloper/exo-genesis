import { create } from 'zustand'

import type { Element, Expedition, ExperimentResult, InventoryItem, Resource, Ship, ShipConfig, UserProfile, UserStats, Zone } from '../types'
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
  boxRewards: Record<string, unknown> | null
  isLoading: boolean
  isAuthReady: boolean
  isContentReady: boolean
  error: string | null

  initAuth: () => Promise<void>
  loadProfile: () => Promise<void>
  loadShips: () => Promise<void>
  loadInventory: () => Promise<void>
  loadActiveExpeditions: () => Promise<void>
  startExpedition: (shipId: string, zoneId: string) => Promise<void>
  claimExpedition: (expeditionId: string) => Promise<void>
  experiment: (elementIds: string[]) => Promise<void>
  loadStats: () => Promise<void>
  loadContent: () => Promise<void>
  clearBoxRewards: () => void
  updateNickname: (username: string) => Promise<void>
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
  boxRewards: null,
  isLoading: false,
  isAuthReady: false,
  isContentReady: false,
  error: null,

  initAuth: async () => {
    if (_initStarted) return
    _initStarted = true
    try {
      set({ isLoading: true, error: null })
      const data = await api.authInit()
      const { is_new, box_rewards, ...rest } = data
      set({ user: rest as UserProfile, boxRewards: (box_rewards as Record<string, unknown>) || null, isLoading: false, isAuthReady: true })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false, isAuthReady: true })
      _initStarted = false
    }
  },

  clearBoxRewards: () => {
    set({ boxRewards: null })
  },

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

  claimExpedition: async (expeditionId) => {
    try {
      set({ isLoading: true, error: null })
      await api.claimExpedition(expeditionId)
      set({ activeExpeditions: get().activeExpeditions.filter((e) => e.id !== expeditionId), isLoading: false })
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
    let attempts = 0
    while (attempts < 3) {
      try {
        const [shipsContent, zonesContent, elementsContent, resourcesContent] = await Promise.all([
          api.getShipsContent(),
          api.getZonesContent(),
          api.getElementsContent(),
          api.getResourcesContent(),
        ])
        set({ shipsContent, zonesContent, elementsContent, resourcesContent, isContentReady: true })
        return
      } catch (e) {
        attempts++
        if (attempts >= 3) {
          console.warn('Content load failed after 3 attempts:', e)
          set({ isContentReady: true })
          return
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  },
}))
