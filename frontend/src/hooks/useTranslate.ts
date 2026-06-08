import { useCallback } from 'react'

import { t } from '../lib/i18n'
import { useSettingsStore } from '../store/settings'

export function useTranslate() {
  const lang = useSettingsStore((s) => s.language)

  const _t = useCallback((key: string) => t(key, lang), [lang])

  return _t
}
