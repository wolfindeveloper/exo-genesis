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
  expected_hmac_strip?: string
  expected_ed_strip?: string
  match_decoded_vs_hash?: boolean
  match_decoded_vs_sig?: boolean
  match_decoded_no_sig_vs_hash?: boolean
  match_decoded_no_sig_vs_sig?: boolean
  match_raw_vs_hash?: boolean
  match_raw_vs_sig?: boolean
  match_raw_no_sig_vs_hash?: boolean
  match_raw_no_sig_vs_sig?: boolean
  match_hmac_strip_vs_hash?: boolean
  match_hmac_strip_vs_sig?: boolean
  match_ed_strip_vs_hash?: boolean
  match_ed_strip_vs_sig?: boolean
  ed25519_ok?: boolean | null
  keys?: string[]
  extra_fields?: string[]
  check_string_decoded?: string
  check_string_raw?: string
  check_string_hmac_strip?: string
  check_string_ed_strip?: string
  cs_sha256_decoded?: string
  cs_sha256_raw?: string
  cs_sha256_hmac_strip?: string
  cs_sha256_ed_strip?: string
  init_data_length?: number
  init_data?: string
  init_data_received?: string
}

export function HmacDebug() {
  const [result, setResult] = useState<HmacResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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
        <>
          <div style={{fontSize:'7px',lineHeight:'1.1'}} className="text-gray-500 text-left mb-1 break-all max-h-24 overflow-y-auto">
            InitData ({result?.init_data_length}ch):
            <br/>{result?.init_data_received || result?.init_data || '?'}
            <button
              onClick={() => {navigator.clipboard.writeText(result?.init_data_received || result?.init_data || ''); setCopied(true); setTimeout(()=>setCopied(false),2000)}}
              className="ml-1 text-blue-400 hover:text-blue-300"
            >{copied ? '✓' : '📋'}</button>
          </div>
          {`hash:${(result?.received_hash||'?').slice(0,10)}… sig:${(result?.received_signature||'?').slice(0,10)}…\n` +
          `dec→h:${result?.match_decoded_vs_hash?'✅':'❌'} nσ→h:${result?.match_decoded_no_sig_vs_hash?'✅':'❌'}\n` +
          `raw→h:${result?.match_raw_vs_hash?'✅':'❌'} nσ→h:${result?.match_raw_no_sig_vs_hash?'✅':'❌'}\n` +
          `stp→h:${result?.match_hmac_strip_vs_hash?'✅':'❌'} ednσ→h:${result?.match_ed_strip_vs_hash?'✅':'❌'}\n` +
          `ed25519:${result?.ed25519_ok === true?'✅':result?.ed25519_ok === false?'❌':'?'}\n` +
          `sha256|d:${(result?.cs_sha256_decoded||'?').slice(0,8)}…r:${(result?.cs_sha256_raw||'?').slice(0,8)}…s:${(result?.cs_sha256_hmac_strip||'?').slice(0,8)}…e:${(result?.cs_sha256_ed_strip||'?').slice(0,8)}…`
        </>
      )}
    </div>
  )
}
