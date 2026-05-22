import { create } from 'zustand'

import type { Element, Expedition, ExperimentResult, InventoryItem, Resource, Ship, ShipConfig, UserProfile, UserStats, Zone } from '../types'
import { api } from '../api/client'

interface GameState {
  user: UserProfile | null
  ships: Ship[]
  inventory: InventoryItem[]
  activeExpedition: Expedition | null
  lastExperiment: ExperimentResult | null
  stats: UserStats | null
  shipsContent: ShipConfig[]
  zonesContent: Zone[]
  elementsContent: Element[]
  resourcesContent: Resource[]
  boxRewards: Record<string, unknown> | null
  isLoading: boolean
  error: string | null

  initAuth: () => Promise<void>
  loadProfile: () => Promise<void>
  loadShips: () => Promise<void>
  loadInventory: () => Promise<void>
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
  activeExpedition: null,
  lastExperiment: null,
  stats: null,
  shipsContent: [],
  zonesContent: [],
  elementsContent: [],
  resourcesContent: [],
  boxRewards: null,
  isLoading: false,
  error: null,

  initAuth: async () => {
    try {
      set({ isLoading: true, error: null })
      const data = await api.authInit()
      const { is_new, box_rewards, ...rest } = data
      set({ user: rest as UserProfile, boxRewards: (box_rewards as Record<string, unknown>) || null, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
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
      set({ isLoading: true })
      const ships = await api.getShips()
      set({ ships, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
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

  startExpedition: async (shipId, zoneId) => {
    try {
      set({ isLoading: true, error: null })
      const expedition = await api.startExpedition(shipId, zoneId)
      set({ activeExpedition: expedition, isLoading: false })
      await get().loadShips()
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  claimExpedition: async (expeditionId) => {
    try {
      set({ isLoading: true, error: null })
      await api.claimExpedition(expeditionId)
      set({ activeExpedition: null, isLoading: false })
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
    try {
      const [shipsContent, zonesContent, elementsContent, resourcesContent] = await Promise.all([
        api.getShipsContent(),
        api.getZonesContent(),
        api.getElementsContent(),
        api.getResourcesContent(),
      ])
      set({ shipsContent, zonesContent, elementsContent, resourcesContent })
    } catch (e) {
      console.warn('Content load failed:', e)
    }
  },
}))
