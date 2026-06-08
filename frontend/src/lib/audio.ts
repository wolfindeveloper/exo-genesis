export interface TrackInfo {
  id: string
  file: string
  title: string
  artist: string
  source: string
  license: string
}

export const MUSIC_TRACKS: TrackInfo[] = [
  {
    id: 'technological_integration',
    file: '/music/technological_integration.mp3',
    title: 'Technological Integration (La Integración de la Tecnología)',
    artist: 'David J. Barrios',
    source: 'Free Music Archive',
    license: 'CC BY 4.0',
  },
]

let _audio: HTMLAudioElement | null = null

export function initAudio(): HTMLAudioElement {
  if (_audio) return _audio
  _audio = new Audio(MUSIC_TRACKS[0].file)
  _audio.loop = true
  _audio.volume = 0.5
  return _audio
}

export function playMusic(): void {
  const el = initAudio()
  if (el.paused) {
    el.play().catch(() => { /* autoplay blocked — user interaction required */ })
  }
}

export function stopMusic(): void {
  const el = initAudio()
  el.pause()
  el.currentTime = 0
}
