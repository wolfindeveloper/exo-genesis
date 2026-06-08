import type { Language } from '../store/settings'

const dict: Record<string, Record<Language, string>> = {
  // NavBar
  'nav.hangar':     { ru: 'Ангар', en: 'Hangar', ua: 'Ангар' },
  'nav.guide':      { ru: 'Гайд', en: 'Guide', ua: 'Гайд' },
  'nav.map':        { ru: 'Карта', en: 'Map', ua: 'Карта' },
  'nav.inv':        { ru: 'Инв', en: 'Inv', ua: 'Інв' },
  'nav.profile':    { ru: 'Проф', en: 'Profile', ua: 'Проф' },

  // Settings
  'settings.title': { ru: 'Настройки', en: 'Settings', ua: 'Налаштування' },
  'settings.lang':  { ru: 'Язык', en: 'Language', ua: 'Мова' },
  'settings.music': { ru: 'Музыка', en: 'Music', ua: 'Музика' },
  'settings.on':    { ru: 'Вкл', en: 'On', ua: 'Увімк' },
  'settings.off':   { ru: 'Выкл', en: 'Off', ua: 'Вимк' },

  // Music attribution
  'music.credit':   {
    ru: '"Technological Integration" — David J. Barrios (Free Music Archive, CC BY 4.0)',
    en: '"Technological Integration" — David J. Barrios (Free Music Archive, CC BY 4.0)',
    ua: '"Technological Integration" — David J. Barrios (Free Music Archive, CC BY 4.0)',
  },

  // NavBar
  'nav.shop':       { ru: 'Лавка', en: 'Shop', ua: 'Крамниця' },

  // Common
  'common.close':   { ru: 'Закрыть', en: 'Close', ua: 'Закрити' },
  'common.save':    { ru: 'Сохранить', en: 'Save', ua: 'Зберегти' },
}

export function t(key: string, lang: Language): string {
  return dict[key]?.[lang] ?? key
}
