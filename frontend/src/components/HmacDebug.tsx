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
  const [deleting, setDeleting] = useState(false)

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
      {(() => {
        if (loading) return 'Checking HMAC...'
        if (result?.error) return 'HMAC error: ' + result.error
        if (!result) return null
        const r = result
        const ch = (v:boolean|undefined) => v ? 'Y' : 'n'
        const e = (v:boolean|null|undefined) => v===true ? 'Y' : v===false ? 'n' : '?'
        return (
          <>
            <div style={{fontSize:'7px',lineHeight:'1.1'}} className="text-gray-500 text-left mb-1 break-all max-h-24 overflow-y-auto">
              ID({r.init_data_length}ch):
              <br/>{r.init_data_received || r.init_data || '?'}
              <button
                onClick={() => {navigator.clipboard.writeText(r.init_data_received || r.init_data || ''); setCopied(true); setTimeout(()=>setCopied(false),2000)}}
                className="ml-1 text-blue-400 hover:text-blue-300"
              >{copied ? 'Y' : 'C'}</button>
              {' '}<button
                disabled={deleting}
                onClick={async () => {
                  if (!confirm('Delete user?')) return
                  setDeleting(true)
                  try {
                    const tg = (window as any).Telegram?.WebApp
                    if (!tg?.initData) return
                    await fetch(BASE_URL+'/debug/delete-me', {
                      method:'POST',
                      headers:{'Authorization':'tma '+tg.initData}
                    })
                    alert('Deleted! Close & reopen Mini App')
                    window.location.reload()
                  } catch(e) {
                    alert('Delete failed')
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="text-red-400 hover:text-red-300"
              >{deleting ? '...' : 'DEL'}</button>
            </div>
            {'hash:'+(r.received_hash||'?').slice(0,10)+' sig:'+(r.received_signature||'?').slice(0,10)+'\n'+
            'dec:'+ch(r.match_decoded_vs_hash)+'/'+ch(r.match_decoded_no_sig_vs_hash)+' '+
            'raw:'+ch(r.match_raw_vs_hash)+'/'+ch(r.match_raw_no_sig_vs_hash)+'\n'+
            'stp:'+ch(r.match_hmac_strip_vs_hash)+'/'+ch(r.match_ed_strip_vs_hash)+' '+
            'ed:'+e(r.ed25519_ok)+'\n'+
            's256|d:'+(r.cs_sha256_decoded||'?').slice(0,8)+' r:'+(r.cs_sha256_raw||'?').slice(0,8)+' s:'+(r.cs_sha256_hmac_strip||'?').slice(0,8)+' e:'+(r.cs_sha256_ed_strip||'?').slice(0,8)}
          </>
        )
      })()}
    </div>
  )
}
