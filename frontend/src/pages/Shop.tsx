import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Gift, Package, ShoppingBag, Sparkles, Star } from 'lucide-react'

import { api } from '../api/client'
import { useGameStore } from '../store/game'
import type { ShopItem } from '../types'

const categoryIcons: Record<string, typeof Package> = {
  resources: Package,
  artifacts: Sparkles,
  premium: Star,
  mystery: Gift,
}

const sellerComments: Record<string, string[]> = {
  fuel_pack: ['«Разумный выбор. Редкость.»', '«Пейте, космонавты, заварку — в космосе она бесполезна, но согревает душу.»'],
  repair_pack: ['«Оптимизм — это вам не прочность. Но звучит лучше.»', '«Купил — починился. Не починился — купи ещё.»'],
  fragment_pack: ['«Бред — он и в галактике бред.»', '«20 фрагментов. 20 шансов запутаться ещё сильнее.»'],
  random_artifact_t1: ['«Дешево и сердито. Как и всё в этой галактике.»', '«Может работать. А может и нет. В этом вся соль.'],
  random_artifact_t2: ['«Ого, вы раскошелились!»', '«T2 выглядит внушительно. До первой поломки.'],
  mystery_box: ['«Никто не знает, что там. Даже я. Особенно я.»', '«Может там артефакт. А может там записка «купи ещё». Спекуляция!»'],
  premium_artifact_t3: ['«Премиум. Звучит дорого. И вы заплатили дорого. Логика.»', '«T3 за 5 звёзд. Бюджетный люкс.'],
  premium_artifact_t4: ['«Вы уверены? Ладно, ваше право.»', '«15 звёзд за шанс. Галактика лотерея.'],
  premium_artifact_t5: ['«50 звёзд. Серьёзно. Вы либо отчаянны, либо богаты. Я ставлю на отчаяние.»', '«Легендарный. Если не легенда — возврат не принимается.'],
  instant_finish: ['«Срезать углы? В космосе нет углов. Но мы их придумаем за 3 звезды.»', '«Мгновенно. Почти. Как и всё в этой вселенной.'],
}

const categories = ['resources', 'artifacts', 'premium', 'mystery']
const categoryLabels: Record<string, string> = {
  resources: 'Ресурсы',
  artifacts: 'Артефакты',
  premium: 'Премиум',
  mystery: 'Ящики',
}

function SellerComment({ itemId, visible }: { itemId: string; visible: boolean }) {
  const comments = sellerComments[itemId]
  if (!comments) return null
  const comment = comments[Math.floor(Math.random() * comments.length)]
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[10px] text-amber-600/60 italic mt-2 leading-relaxed text-center"
        >
          {comment}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export function Shop() {
  const loadProfile = useGameStore((s) => s.loadProfile)
  const loadInventory = useGameStore((s) => s.loadInventory)
  const user = useGameStore((s) => s.user)

  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('resources')
  const [buyerCommentId, setBuyerCommentId] = useState<string | null>(null)
  const commentTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    api.getShopCatalog()
      .then(setItems)
      .catch(() => setError('Не удалось загрузить лавку'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!successMsg) return
    const t2 = setTimeout(() => setSuccessMsg(null), 3500)
    return () => clearTimeout(t2)
  }, [successMsg])

  useEffect(() => {
    if (!buyerCommentId) return
    clearTimeout(commentTimeout.current)
    commentTimeout.current = setTimeout(() => setBuyerCommentId(null), 3000)
    return () => clearTimeout(commentTimeout.current)
  }, [buyerCommentId])

  const filtered = items.filter((i) => i.category === activeCategory)

  const handleBuy = useCallback(async (shopItem: ShopItem) => {
    setBuying(shopItem.id)
    setError(null)
    try {
      await api.buyShopItem(shopItem.id)
      setSuccessMsg(shopItem.name_key)
      setBuyerCommentId(shopItem.id)
      await Promise.all([loadProfile(), loadInventory()])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBuying(null)
    }
  }, [loadProfile, loadInventory])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-500 text-xs font-display uppercase tracking-widest animate-pulse">
          Загружаем барахло...
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-sm text-amber-400 uppercase tracking-[0.15em]">
          Спекулятивная лавка
        </h1>
        <p className="text-[10px] text-slate-600 mt-1 max-w-[260px] mx-auto leading-relaxed">
          «Мы не берём карты. Мы не берём наличные. Мы берём вашу веру в то, что эта сделка имеет смысл. Этого достаточно.»
        </p>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <span className="text-neon-cyan font-mono">✦ {user?.balance_xgen ?? 0}</span>
        <span className="text-amber-400 font-mono">⭐ {user?.balance_stars ?? 0}</span>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <span className="text-[11px] text-red-300">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto -mx-4 px-4 scrollbar-none">
        {categories.map((cat) => {
          const active = activeCategory === cat
          const Icon = categoryIcons[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-display uppercase tracking-wider transition-all shrink-0 ${
                active
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'text-slate-600 hover:text-slate-400 border border-transparent'
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              {categoryLabels[cat]}
            </button>
          )
        })}
      </div>

      {/* Items grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {filtered.map((item) => {
            const isPremium = item.price.currency === 'stars'
            const canAfford = isPremium
              ? (user?.balance_stars ?? 0) >= item.price.amount
              : (user?.balance_xgen ?? 0) >= item.price.amount
            const isBuying = buying === item.id

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={`rounded-xl border p-3.5 space-y-2 ${
                  isPremium
                    ? 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/15'
                    : 'bg-space-800/60 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-amber-500/70 shrink-0" />
                      <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider truncate">
                        {item.name_key}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      {item.description_key}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`font-display text-sm tabular-nums ${isPremium ? 'text-amber-400' : 'text-neon-cyan'}`}>
                      {item.price.amount}
                    </span>
                    <span className={`text-[10px] ml-0.5 ${isPremium ? 'text-amber-400' : 'text-neon-cyan'}`}>
                      {isPremium ? '⭐' : '✦'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || isBuying}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all ${
                      isBuying
                        ? 'bg-slate-700/50 text-slate-500'
                        : canAfford
                          ? isPremium
                            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/25 active:scale-[0.97]'
                            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 active:scale-[0.97]'
                          : 'bg-slate-800/50 text-slate-700 border border-slate-700/30 cursor-not-allowed'
                    }`}
                  >
                    {isBuying ? (
                      <span className="flex items-center justify-center gap-1">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Package size={12} />
                        </motion.span>
                        Обрабатываем...
                      </span>
                    ) : canAfford ? (
                      'Приобрести'
                    ) : (
                      'Не хватает'
                    )}
                  </button>
                </div>

                <SellerComment itemId={item.id} visible={buyerCommentId === item.id} />
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-4 right-4 bottom-20 z-[60] mx-auto max-w-lg"
          >
            <div className="bg-space-800/95 backdrop-blur-sm border border-amber-500/20 rounded-xl px-4 py-3 text-center shadow-[0_0_20px_rgba(245,158,11,.1)]">
              <p className="text-[11px] text-amber-400/90 font-display tracking-wider">
                ✔ {successMsg} — теперь ваш
              </p>
              <p className="text-[9px] text-slate-600 mt-1">
                «Спасибо за покупку. Возвращайтесь, когда нагуляете аппетит к сомнительным сделкам.»
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
