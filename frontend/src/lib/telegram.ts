interface TelegramWebApp {
  initData: string
  initDataUnsafe?: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
      photo_url?: string
    }
  }
  ready: () => void
  expand: () => void
  showPopup?: (params: { title: string; message: string; buttons: { type: string }[] }) => void
  HapticFeedback?: {
    impactOccurred: (style: string) => void
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp
}

export function getInitData(): string {
  return getTelegramWebApp()?.initData ?? ''
}

export function getAvatarUrl(): string | undefined {
  return getTelegramWebApp()?.initDataUnsafe?.user?.photo_url
}

export function getFirstName(): string | undefined {
  return getTelegramWebApp()?.initDataUnsafe?.user?.first_name
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
}
