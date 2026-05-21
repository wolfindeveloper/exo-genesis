import { create } from 'zustand'

import type { Expedition, ExperimentResult, InventoryItem, Ship, UserProfile } from '../types'
import { api } from '../api/client'

interface GameState {
  user: UserProfile | null
  ships: Ship[]
  inventory: InventoryItem[]
  activeExpedition: Expedition | null
  lastExperiment: ExperimentResult | null
  isLoading: boolean
  error: string | null

  loadProfile: () => Promise<void>
  loadShips: () => Promise<void>
  loadInventory: () => Promise<void>
  startExpedition: (shipId: string, zoneId: string) => Promise<void>
  claimExpedition: (expeditionId: string) => Promise<void>
  experiment: (elementIds: string[]) => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  ships: [],
  inventory: [],
  activeExpedition: null,
  lastExperiment: null,
  isLoading: false,
  error: null,

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
}))
