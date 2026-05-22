import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface HmacResult {
  ok?: boolean
  error?: string
  received_hash?: string
  received_signature?: string
  expected_decoded?: string
  expected_decoded_no_sig?: string
  expected_raw?: string
  expected_raw_no_sig?: string
  match_decoded_vs_hash?: boolean
  match_decoded_vs_sig?: boolean
  match_decoded_no_sig_vs_hash?: boolean
  match_decoded_no_sig_vs_sig?: boolean
  match_raw_vs_hash?: boolean
  match_raw_vs_sig?: boolean
  match_raw_no_sig_vs_hash?: boolean
  match_raw_no_sig_vs_sig?: boolean
  ed25519_ok?: boolean | null
  keys?: string[]
  extra_fields?: string[]
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
        `hash: ${(result?.received_hash||'?').slice(0,10)}...  sig: ${(result?.received_signature||'?').slice(0,10)}...\n` +
        `dec w/ sig →hash:${result?.match_decoded_vs_hash?'✅':'❌'}  →sig:${result?.match_decoded_vs_sig?'✅':'❌'}\n` +
        `dec no sig →hash:${result?.match_decoded_no_sig_vs_hash?'✅':'❌'}  →sig:${result?.match_decoded_no_sig_vs_sig?'✅':'❌'}\n` +
        `raw w/ sig →hash:${result?.match_raw_vs_hash?'✅':'❌'}  →sig:${result?.match_raw_vs_sig?'✅':'❌'}\n` +
        `raw no sig →hash:${result?.match_raw_no_sig_vs_hash?'✅':'❌'}  →sig:${result?.match_raw_no_sig_vs_sig?'✅':'❌'}\n` +
        `ed25519: ${result?.ed25519_ok === true ? '✅' : result?.ed25519_ok === false ? '❌' : '?'}`
      )}
    </div>
  )
}
