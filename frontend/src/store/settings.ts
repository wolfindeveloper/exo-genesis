import { create } from 'zustand'

export type Language = 'ru' | 'en' | 'ua'

interface SettingsState {
  language: Language
  musicEnabled: boolean
  settingsOpen: boolean

  setLanguage: (lang: Language) => void
  toggleMusic: () => void
  setSettingsOpen: (open: boolean) => void
}

function load(): { language: Language; musicEnabled: boolean } {
  try {
    const raw = localStorage.getItem('exo-settings')
    if (!raw) return { language: 'ru', musicEnabled: true }
    const parsed = JSON.parse(raw)
    return {
      language: ['ru', 'en', 'ua'].includes(parsed.language) ? parsed.language : 'ru',
      musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true,
    }
  } catch {
    return { language: 'ru', musicEnabled: true }
  }
}

function save(state: { language: Language; musicEnabled: boolean }) {
  try {
    localStorage.setItem('exo-settings', JSON.stringify(state))
  } catch {
    // storage full or unavailable — ignore
  }
}

const initial = load()

export const useSettingsStore = create<SettingsState>((set) => ({
  language: initial.language,
  musicEnabled: initial.musicEnabled,
  settingsOpen: false,

  setLanguage: (language) => {
    set((s) => {
      const next = { ...s, language }
      save(next)
      return { language }
    })
  },

  toggleMusic: () => {
    set((s) => {
      const next = { ...s, musicEnabled: !s.musicEnabled }
      save(next)
      return { musicEnabled: next.musicEnabled }
    })
  },

  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}))
