import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { useTranslate } from '../hooks/useTranslate'
import { MUSIC_TRACKS, playMusic, stopMusic } from '../lib/audio'
import { useSettingsStore, type Language } from '../store/settings'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'ua', label: 'Українська' },
]

export function SettingsSheet() {
  const t = useTranslate()
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const musicEnabled = useSettingsStore((s) => s.musicEnabled)
  const toggleMusic = useSettingsStore((s) => s.toggleMusic)

  const handleClose = useCallback(() => setSettingsOpen(false), [setSettingsOpen])

  const handleToggleMusic = useCallback(() => {
    const next = !musicEnabled
    toggleMusic()
    if (next) playMusic()
    else stopMusic()
  }, [musicEnabled, toggleMusic])

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[95] bg-space-900 border border-white/10 rounded-t-2xl shadow-2xl max-w-lg mx-auto"
          >
            <div className="p-5 pb-8 space-y-5">
              {/* Handle */}
              <div className="flex justify-center -mt-2 mb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Title */}
              <h2 className="font-display text-base text-neon-cyan uppercase tracking-widest text-center">
                {t('settings.title')}
              </h2>

              {/* Section: Language */}
              <div className="glass-card p-3 space-y-2">
                <p className="text-[10px] font-display uppercase tracking-wider text-slate-500">
                  {t('settings.lang')}
                </p>
                <div className="flex gap-2">
                  {LANGUAGES.map((lang) => {
                    const active = language === lang.value
                    return (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-display uppercase tracking-wider transition-all ${
                          active
                            ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                            : 'bg-space-600/50 text-slate-400 border border-transparent hover:text-slate-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section: Music */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-display uppercase tracking-wider text-slate-500">
                    {t('settings.music')}
                  </p>
                  <button
                    onClick={handleToggleMusic}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      musicEnabled ? 'bg-neon-cyan/30' : 'bg-space-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: musicEnabled ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 leading-relaxed">
                  {MUSIC_TRACKS[0].title} — {MUSIC_TRACKS[0].artist}<br />
                  {MUSIC_TRACKS[0].source} ({MUSIC_TRACKS[0].license})
                </p>
              </div>

              {/* Close */}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 font-display text-sm uppercase tracking-wider transition text-slate-400"
              >
                {t('common.close')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
