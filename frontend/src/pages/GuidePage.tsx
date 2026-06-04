import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Check, FileText, Lock, Sparkles, TriangleAlert } from 'lucide-react'
import { useGameStore } from '../store/game'
import { api } from '../api/client'
import type { GuideChapterDetail, GuideEntryDetail } from '../types'

export default function GuidePage() {
  const user = useGameStore((s) => s.user)
  const guideChapters = useGameStore((s) => s.guideChapters)
  const loadGuideChapters = useGameStore((s) => s.loadGuideChapters)
  const researchEntry = useGameStore((s) => s.researchEntry)
  const fixGlitch = useGameStore((s) => s.fixGlitch)
  const claimGuideReward = useGameStore((s) => s.claimGuideReward)
  const isLoading = useGameStore((s) => s.isLoading)
  const artifactsContent = useGameStore((s) => s.artifactsContent)

  const [selectedChapter, setSelectedChapter] = useState<GuideChapterDetail | null>(null)
  const [openedEntry, setOpenedEntry] = useState<GuideEntryDetail | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    loadGuideChapters()
  }, [])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3000)
    return () => clearTimeout(t)
  }, [msg])

  async function loadChapterDetail(chapterId: string) {
    try {
      const data = await api.getGuideChapter(chapterId)
      setSelectedChapter(data)
      return data
    } catch (e) {
      setMsg((e as Error).message)
      return null
    }
  }

  async function handleResearch(entry: GuideEntryDetail) {
    if (!selectedChapter) return
    try {
      await researchEntry(selectedChapter.id, entry.id)
      const data = await loadChapterDetail(selectedChapter.id)
      const updated = data?.entries.find((e) => e.id === entry.id)
      if (updated) setOpenedEntry(updated)
      setMsg(`«${entry.title}» — исследовано`)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  async function handleFixGlitch(entry: GuideEntryDetail) {
    if (!selectedChapter) return
    try {
      await fixGlitch(selectedChapter.id, entry.id)
      const data = await loadChapterDetail(selectedChapter.id)
      const updated = data?.entries.find((e) => e.id === entry.id)
      if (updated) setOpenedEntry(updated)
      setMsg('Глюк исправлен')
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  async function handleClaimReward() {
    if (!selectedChapter) return
    try {
      const result = await claimGuideReward(selectedChapter.id)
      const name = result?.artifact_name ? getArtifactName(result.artifact_name) : 'артефакт'
      setMsg(`Награда получена: ${name}!`)
      await loadChapterDetail(selectedChapter.id)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  function getArtifactName(artifactId: string) {
    const a = artifactsContent.find((a) => a.id === artifactId)
    return a?.name_key ?? artifactId
  }

  function glitchText(text: string): string {
    const parts = text.split(/([.!?])/)
    return parts.map((p) => {
      if (Math.random() < 0.3) {
        return p.length > 3
          ? p.substring(0, Math.ceil(p.length / 2)) + ' [ДАННЫЕ УДАЛЕНЫ]'
          : '[ДАННЫЕ УДАЛЕНЫ]'
      }
      return p
    }).join('')
  }

  // Chapter list view
  if (!selectedChapter) {
    return (
      <div
        className="min-h-screen text-white font-mono relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, #1a2a40 0%, #050505 100%)' }}
      >
        <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.15em] text-white">ПУТЕВОДИТЕЛЬ</h1>
              <p className="text-[6px] text-cyan-400/20 tracking-wider mt-0.5">Интерактивная база данных с приступами амнезии</p>
            </div>
          </div>

          {/* Fragments balance */}
          <div className="bg-white/5 backdrop-blur-[12px] rounded-xl border border-cyan-500/15 p-3 mb-5 flex items-center justify-between">
            <span className="text-[8px] text-cyan-400/30 tracking-wider">ФРАГМЕНТЫ БРЕДА</span>
            <span className="text-sm font-bold text-cyan-300 drop-shadow-[0_0_6px_rgba(0,245,255,.2)]">
              {user?.balance_fragments ?? 0}
            </span>
          </div>

          {/* Chapter cards */}
          <div className="flex flex-col gap-3">
            {guideChapters.map((ch) => {
              const pct = ch.total_entries > 0 ? Math.round((ch.researched_count / ch.total_entries) * 100) : 0
              const isSecret = ch.is_secret
              return (
                <button
                  key={ch.id}
                  onClick={() => loadChapterDetail(ch.id)}
                  className="text-left bg-white/5 backdrop-blur-[12px] rounded-xl border border-cyan-500/15 p-4 hover:bg-white/[0.07] active:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isSecret ? (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-cyan-400/60" />
                      )}
                      <span className={`text-xs font-bold tracking-wider ${isSecret ? 'text-amber-300' : 'text-white'}`}>
                        {ch.title}
                      </span>
                    </div>
                    <span className="text-[8px] text-cyan-400/30">
                      {ch.researched_count}/{ch.total_entries}
                    </span>
                  </div>

                  <p className="text-[7px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                    {ch.description}
                  </p>

                  {/* Progress bar */}
                  <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-cyan-500/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/60 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Reward indicator */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[6px] text-cyan-400/20">
                      Награда: {getArtifactName(ch.reward_artifact_id)}
                    </span>
                    {ch.reward_claimed && (
                      <span className="text-[7px] text-green-400/50">Награда получена</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {guideChapters.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-3" />
              <p className="text-[10px] text-slate-500">Загрузка путеводителя...</p>
            </div>
          )}
        </div>

        {msg && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-1.5">
              <span className="text-[8px] text-cyan-400/60">{msg}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Chapter detail view
  const chapter = selectedChapter
  const entryCost = (entry: GuideEntryDetail) => entry.glitch_chance && entry.glitch_chance > 0
    ? entry.fragment_cost * 2
    : entry.fragment_cost

  return (
    <div
      className="min-h-screen text-white font-mono relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #1a2a40 0%, #050505 100%)' }}
    >
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-24">
        {/* Back button */}
        <button
          onClick={() => {
            setSelectedChapter(null)
            setOpenedEntry(null)
          }}
          className="flex items-center gap-2 text-[10px] text-cyan-400/40 hover:text-cyan-300/60 transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          НАЗАД К ГЛАВАМ
        </button>

        {openedEntry ? (
          // Article detail view
          <div className="animate-fade-in">
            <button
              onClick={() => setOpenedEntry(null)}
              className="flex items-center gap-2 text-[10px] text-cyan-400/40 hover:text-cyan-300/60 transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" />
              К СТАТЬЯМ
            </button>

            <div className="bg-white/5 backdrop-blur-[12px] rounded-xl border border-cyan-500/15 p-5">
              <h2 className="text-sm font-bold tracking-wide mb-4">{openedEntry.title}</h2>

              {openedEntry.status === 'researched' && openedEntry.text && (
                <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-line">
                  {openedEntry.text}
                </p>
              )}

              {openedEntry.status === 'glitched' && openedEntry.text && (
                <div>
                  <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-line [animation:glitch-text_0.5s_ease-in-out_infinite]">
                    {glitchText(openedEntry.text)}
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <TriangleAlert className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[8px] text-amber-400/60 mb-2">
                          Текст повреждён системной ошибкой. Требуется исправление.
                        </p>
                        <button
                          disabled={isLoading || (user?.balance_fragments ?? 0) < entryCost(openedEntry)}
                          onClick={() => handleFixGlitch(openedEntry)}
                          className="text-[8px] px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/15 transition-colors"
                        >
                          Исправить за {entryCost(openedEntry)} фрагментов
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {openedEntry.status === 'locked' && (
                <div className="text-center py-8">
                  <Lock className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                  <p className="text-[9px] text-slate-500">
                    {openedEntry.unlock_event
                      ? 'Требуется специальное событие для открытия'
                      : `Требуется ${openedEntry.fragment_cost} фрагментов бреда`}
                  </p>
                </div>
              )}

              {openedEntry.status === 'hidden' && (
                <div className="text-center py-8">
                  <Lock className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                  <p className="text-[9px] text-slate-500">Условие открытия ещё не выполнено</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Entries list view
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-wide">{chapter.title}</h2>
              <span className="text-[8px] text-cyan-400/30">
                {chapter.researched_count}/{chapter.total_entries}
              </span>
            </div>
            <p className="text-[7px] text-slate-500 leading-relaxed mb-5">{chapter.description}</p>

            {/* Progress */}
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-cyan-500/10 mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/60 transition-all duration-500"
                style={{ width: `${chapter.total_entries > 0 ? Math.round((chapter.researched_count / chapter.total_entries) * 100) : 0}%` }}
              />
            </div>

            {/* Entries list */}
            <div className="flex flex-col gap-2">
              {chapter.entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border p-3 transition-all ${
                    entry.status === 'researched'
                      ? 'bg-green-500/5 border-green-500/15'
                      : entry.status === 'glitched'
                      ? 'bg-amber-500/5 border-amber-500/15'
                      : 'bg-white/5 border-cyan-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {entry.status === 'researched' ? (
                        <Check className="w-3 h-3 text-green-400 shrink-0" />
                      ) : entry.status === 'glitched' ? (
                        <TriangleAlert className="w-3 h-3 text-amber-400 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                      )}
                      <span className={`text-[9px] truncate ${
                        entry.status === 'researched' ? 'text-green-300/80' : 'text-slate-300'
                      }`}>
                        {entry.title}
                      </span>
                    </div>

                    {entry.status === 'researched' && (
                      <button
                        onClick={() => setOpenedEntry(entry)}
                        className="text-[7px] text-cyan-400/40 hover:text-cyan-300/60 ml-2 shrink-0"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}

                    {entry.status === 'glitched' && (
                      <button
                        onClick={() => setOpenedEntry(entry)}
                        className="text-[7px] text-amber-400/40 hover:text-amber-300/60 ml-2 shrink-0"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}

                    {entry.status === 'locked' && (
                      <button
                        disabled={isLoading || (user?.balance_fragments ?? 0) < entry.fragment_cost}
                        onClick={() => handleResearch(entry)}
                        className={`text-[7px] px-2 py-1 rounded-lg border transition-colors shrink-0 ml-2 ${
                          (user?.balance_fragments ?? 0) >= entry.fragment_cost
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15'
                            : 'bg-slate-800/50 border-slate-700/20 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {entry.fragment_cost > 0 ? `${entry.fragment_cost} фр` : 'Открыть'}
                      </button>
                    )}
                  </div>

                  {entry.fragment_cost > 0 && entry.status === 'locked' && (
                    <div className="mt-1 text-[6px] text-slate-600">
                      Стоимость: {entry.fragment_cost} фрагментов бреда
                    </div>
                  )}
                  {entry.unlock_event && entry.status !== 'researched' && (
                    <div className="mt-1 text-[6px] text-slate-600">
                      {entry.has_event ? '✓ Условие выполнено' : 'Требуется особое событие'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chapter reward */}
            {chapter.all_researched && !chapter.reward_claimed && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-b from-cyan-500/10 to-purple-500/5 border border-cyan-500/25">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold tracking-wider text-amber-300">
                    ГЛАВА ЗАВЕРШЕНА!
                  </span>
                </div>
                <p className="text-[8px] text-slate-400 mb-3">
                  Путеводитель материализует артефакт: {getArtifactName(chapter.reward_artifact_id)}
                </p>
                <button
                  disabled={isLoading}
                  onClick={handleClaimReward}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-[9px] font-bold tracking-wider text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ЗАБРАТЬ НАГРАДУ
                </button>
              </div>
            )}

            {chapter.reward_claimed && (
              <div className="mt-6 p-4 rounded-xl bg-green-500/5 border border-green-500/15">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[9px] text-green-300/60">
                    Награда «{getArtifactName(chapter.reward_artifact_id)}» получена
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {msg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-1.5">
            <span className="text-[8px] text-cyan-400/60">{msg}</span>
          </div>
        </div>
      )}
    </div>
  )
}
