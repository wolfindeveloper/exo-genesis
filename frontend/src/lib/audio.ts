import { api } from '../api/client'

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

const LISTEN_EVENT = 'listened_5x'
const LISTEN_THRESHOLD = 5

let _audio: HTMLAudioElement | null = null
let _playOnClick: (() => void) | null = null

function incrementListenCount(): number {
  try {
    const raw = localStorage.getItem('exo-listen-count')
    const count = (raw ? Number.parseInt(raw, 10) : 0) + 1
    localStorage.setItem('exo-listen-count', String(count))
    return count
  } catch {
    return 0
  }
}

function tryLogListenedEvent() {
  api.logEvent(LISTEN_EVENT).catch(() => {})
}

function onTrackEnded() {
  const count = incrementListenCount()
  if (count >= LISTEN_THRESHOLD) {
    tryLogListenedEvent()
  }
  _audio?.play().catch(() => {})
}

export function initAudio(): HTMLAudioElement {
  if (_audio) return _audio
  _audio = new Audio(MUSIC_TRACKS[0].file)
  _audio.volume = 0.5
  _audio.addEventListener('ended', onTrackEnded)
  return _audio
}

export function playMusic(): void {
  const el = initAudio()
  if (el.paused) {
    el.play().catch(() => {
      if (_playOnClick) return
      _playOnClick = () => {
        el.play().catch(() => {})
      }
      document.addEventListener('click', _playOnClick, { once: true })
    })
  }
}

export function stopMusic(): void {
  const el = initAudio()
  el.pause()
  el.currentTime = 0
}
