import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Diamond, Gift, Package, ShoppingBag, Star } from 'lucide-react'

import { api } from '../api/client'
import { useGameStore } from '../store/game'
import type { ShopBuyResponse, ShopItem } from '../types'

const rarityConfig: Record<string, { color: string; label: string }> = {
  common: { color: 'text-slate-400', label: 'C' },
  uncommon: { color: 'text-green-400', label: 'U' },
  rare: { color: 'text-blue-400', label: 'R' },
  epic: { color: 'text-purple-400', label: 'E' },
  legendary: { color: 'text-amber-400', label: 'L' },
}

const tierNames: Record<number, string> = {
  1: 'Ранг I',
  2: 'Ранг II',
  3: 'Ранг III',
  4: 'Ранг IV',
  5: 'Ранг V',
}

const categoryIcons: Record<string, typeof Package> = {
  resources: Package,
  artifacts: Diamond,
  premium: Star,
  mystery: Gift,
}

const sellerComments: Record<string, string[]> = {
  fuel_pack: ['«Разумный выбор. Редкость.»', '«Пейте, космонавты, заварку — в космосе она бесполезна, но согревает душу.»'],
  repair_pack: ['«Оптимизм — это вам не прочность. Но звучит лучше.»', '«Купил — починился. Не починился — купи ещё.»'],
  fragment_pack: ['«Бред — он и в галактике бред.»', '«20 фрагментов. 20 шансов запутаться ещё сильнее.»'],
  mystery_box: ['«Никто не знает, что там. Даже я. Особенно я.»', '«Может там артефакт. А может там записка «купи ещё». Спекуляция!»'],
  instant_finish: ['«Срезать углы? В космосе нет углов. Но мы их придумаем за 3 звезды.»', '«Мгновенно. Почти. Как и всё в этой вселенной.'],
}

const artifactComments: Record<number, string[]> = {
  1: ['«Начальный уровень. Как первая работа.»', '«T1 — это вам не T2. Но и не T0. А T0 нет.»'],
  2: ['«Уже что-то. Почти.»', '«Второй ранг. Звучит лучше, чем «почти легендарка».»'],
  3: ['«Редкость. Как честный политик.»', '«T3. Золотая середина между «дешево» и «дорого».»'],
  4: ['«Эпик. Вы либо везунчик, либо транжира.»', '«T4. Если не работает — попробуйте перезагрузить вселенную.»'],
  5: ['«Легендарно. Поздравляю. Вы разорились.»', '«T5. Единственное, что легендарнее этого артефакта — ваша способность тратить звёзды.»'],
}

const statLabels: Record<string, string> = {
  speed_mod: '⚡ Скорость',
  stability_bonus: '🛡️ Стабильность',
  fuel_efficiency: '⛽ Расход',
}

const categories = ['resources', 'artifacts', 'premium', 'mystery']
const categoryLabels: Record<string, string> = {
  resources: 'Ресурсы',
  artifacts: 'Артефакты',
  premium: 'Премиум',
  mystery: 'Ящики',
}

function getComment(item: ShopItem): string | null {
  if (item.type === 'artifact' && item.tier) {
    const pool = artifactComments[item.tier]
    if (!pool) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const pool = sellerComments[item.id]
  if (!pool) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

function SellerComment({ item, visible }: { item: ShopItem; visible: boolean }) {
  const comment = getComment(item)
  if (!comment) return null
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

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">
      <span className="text-[9px]">{statLabels[label] || label}</span>
      <span className={value > 0 ? 'text-neon-cyan' : 'text-slate-500'}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </span>
  )
}

function ArtifactCard({
  item,
  canAfford,
  isBuying,
  onBuy,
  buyerCommentVisible,
}: {
  item: ShopItem
  canAfford: boolean
  isBuying: boolean
  onBuy: () => void
  buyerCommentVisible: boolean
}) {
  const rarity = rarityConfig[item.rarity ?? 'common'] ?? rarityConfig.common
  const stats = item.stats_modifiers ?? {}
  const isStars = item.price.currency === 'stars'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="rounded-xl border border-white/5 bg-space-800/60 p-3.5 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${rarity.color.replace('text', 'border')}/30 bg-black/30`}>
            <Diamond size={16} className={rarity.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-bold ${rarity.color} px-1 py-0.5 rounded border ${rarity.color.replace('text', 'border')}/30 leading-none`}>
                {rarity.label}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">{tierNames[item.tier ?? 1]}</span>
              <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider truncate">
                {item.name_key}
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              {item.description_key}
            </p>
            {Object.keys(stats).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(stats).map(([key, val]) => (
                  <StatBadge key={key} label={key} value={val} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className={`font-display text-sm tabular-nums ${isStars ? 'text-amber-400' : 'text-neon-cyan'}`}>
            {item.price.amount}
          </span>
          <span className={`text-[10px] ml-0.5 ${isStars ? 'text-amber-400' : 'text-neon-cyan'}`}>
            {isStars ? '⭐' : '✦'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onBuy}
          disabled={!canAfford || isBuying}
          className={`flex-1 py-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all ${
            isBuying
              ? 'bg-slate-700/50 text-slate-500'
              : canAfford
                ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 active:scale-[0.97]'
                : 'bg-slate-800/50 text-slate-700 border border-slate-700/30 cursor-not-allowed'
          }`}
        >
          {isBuying ? (
            <span className="flex items-center justify-center gap-1">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
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

      <SellerComment item={item} visible={buyerCommentVisible} />
    </motion.div>
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
  const [buyerCommentItem, setBuyerCommentItem] = useState<ShopItem | null>(null)
  const [lastBuyResult, setLastBuyResult] = useState<ShopBuyResponse | null>(null)
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
    if (!buyerCommentItem) return
    clearTimeout(commentTimeout.current)
    commentTimeout.current = setTimeout(() => setBuyerCommentItem(null), 3000)
    return () => clearTimeout(commentTimeout.current)
  }, [buyerCommentItem])

  const shopItems = items.filter((i) => i.category === activeCategory && i.type !== 'artifact')
  const artifactItems = items.filter((i) => i.category === 'artifacts' && i.type === 'artifact')
  const isArtifactCategory = activeCategory === 'artifacts'

  const handleBuy = useCallback(async (shopItem: ShopItem) => {
    setBuying(shopItem.id)
    setError(null)
    try {
      const result = await api.buyShopItem(shopItem.id)
      setSuccessMsg(shopItem.name_key)
      setBuyerCommentItem(shopItem)
      if (result.granted.length > 0) {
        setLastBuyResult(result)
      }
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
      <div className="text-center">
        <h1 className="font-display text-sm text-amber-400 uppercase tracking-[0.15em]">
          Спекулятивная лавка
        </h1>
        <p className="text-[10px] text-slate-600 mt-1 max-w-[260px] mx-auto leading-relaxed">
          «Мы не берём карты. Мы не берём наличные. Мы берём вашу веру в то, что эта сделка имеет смысл. Этого достаточно.»
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        <span className="text-neon-cyan font-mono">✦ {user?.balance_xgen ?? 0}</span>
        <span className="text-amber-400 font-mono">⭐ {user?.balance_stars ?? 0}</span>
      </div>

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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {isArtifactCategory ? (
            artifactItems.length > 0 ? (
              [5, 4, 3, 2, 1].map((tier) => {
                const tierArtifacts = artifactItems.filter((a) => a.tier === tier)
                if (tierArtifacts.length === 0) return null
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] text-slate-600 font-display uppercase tracking-widest">
                        {tierNames[tier]}
                      </span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    {tierArtifacts.map((item) => {
                      const canAfford = item.price.currency === 'stars'
                        ? (user?.balance_stars ?? 0) >= item.price.amount
                        : (user?.balance_xgen ?? 0) >= item.price.amount
                      return (
                        <ArtifactCard
                          key={item.id}
                          item={item}
                          canAfford={canAfford}
                          isBuying={buying === item.id}
                          onBuy={() => handleBuy(item)}
                          buyerCommentVisible={buyerCommentItem?.id === item.id}
                        />
                      )
                    })}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Diamond size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-[11px] text-slate-600">Артефакты закончились</p>
              </div>
            )
          ) : (
            shopItems.map((item) => {
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

                  <SellerComment item={item} visible={buyerCommentItem?.id === item.id} />
                </motion.div>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>

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

      {/* Reward reveal */}
      <AnimatePresence>
        {lastBuyResult && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLastBuyResult(null)} />
            <motion.div
              className="relative w-full sm:max-w-md bg-gradient-to-b from-space-800 to-space-900 border border-amber-500/20 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
              initial={{ y: '100%', opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '30%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.9 }}
            >
              <div className="px-5 pt-6 pb-2 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3"
                >
                  <Gift size={24} className="text-amber-400" />
                </motion.div>
                <h2 className="font-display text-sm text-amber-400 uppercase tracking-[0.15em]">
                  Таинственный ящик
                </h2>
                <p className="text-[10px] text-slate-500 mt-1">
                  «Вселенная щедра сегодня. Или просто издевается.»
                </p>
              </div>

              <div className="px-5 py-4 space-y-2">
                {lastBuyResult.granted.map((g, i) => (
                  <motion.div
                    key={`${g.item_config_id}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-3.5 py-3 border border-white/5"
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      g.type === 'artifact'
                        ? 'bg-purple-500/15 border border-purple-500/25'
                        : 'bg-neon-cyan/10 border border-neon-cyan/20'
                    }`}>
                      {g.type === 'artifact' ? (
                        <Diamond size={14} className="text-purple-400" />
                      ) : (
                        <Package size={14} className="text-neon-cyan" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate">
                        {g.name_key || g.item_config_id}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {g.type === 'artifact' ? 'Артефакт' : 'Ресурс'}
                        {g.tier ? ` · T${g.tier}` : ''}
                      </p>
                    </div>
                    {g.quantity && g.quantity > 1 && (
                      <span className="shrink-0 text-xs text-slate-400 font-mono">
                        ×{g.quantity}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="px-5 pb-6 pt-2">
                <button
                  onClick={() => setLastBuyResult(null)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/25 text-amber-400 text-[11px] font-display uppercase tracking-wider active:scale-[0.97] transition-all"
                >
                  Забрать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
