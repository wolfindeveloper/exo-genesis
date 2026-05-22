import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface HmacResult {
  ok?: boolean
  error?: string
  received_hash?: string
  expected_decoded?: string
  expected_raw?: string
  match_decoded?: boolean
  match_raw?: boolean
  keys?: string[]
  check_string_decoded?: string
  check_string_raw?: string
  init_data_length?: number
}

export function HmacDebug() {
  const [result, setResult] = useState<HmacResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.initData) return

    setLoading(true)
    fetch(`${BASE_URL}/debug/hmac?tg_init_data=${encodeURIComponent(tg.initData)}`)
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ error: 'fetch failed' }))
      .finally(() => setLoading(false))
  }, [])

  if (!result && !loading) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[201] bg-gray-900/95 p-2 text-center text-[9px] text-gray-300 font-mono whitespace-pre-wrap break-all">
      {loading ? 'Checking HMAC...' : result?.error ? `HMAC error: ${result.error}` : (
        `→ ${result?.ok ? '✅ MATCH' : '❌ MISMATCH'}\n` +
        `received:    ${result?.received_hash?.slice(0, 16)}...\n` +
        `decoded:     ${result?.expected_decoded?.slice(0, 16)}... ${result?.match_decoded ? '✅' : '❌'}\n` +
        `raw:         ${result?.expected_raw?.slice(0, 16)}... ${result?.match_raw ? '✅' : '❌'}\n` +
        `keys: ${result?.keys?.join(', ') || '?'}\n` +
        `len: ${result?.init_data_length || '?'}`
      )}
    </div>
  )
}
