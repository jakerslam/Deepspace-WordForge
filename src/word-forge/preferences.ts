import { useSyncExternalStore } from 'react'
import { useUser } from 'deepspace'

export const TROPE_SECTIONS = ['overview', 'world', 'characters', 'plot'] as const
export type TropeSection = typeof TROPE_SECTIONS[number]
type Preference = 'tropes' | 'ai' | TropeSection
const changeEvent = 'word-forge-preferences'

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(changeEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(changeEvent, listener)
  }
}

export function useSuggestionPreferences() {
  const { user } = useUser()
  const key = `word-forge:preferences:${user?.email ?? 'anonymous'}`
  const raw = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(key) ?? '{}' } catch { return '{}' }
  }, () => '{}')
  let values: Partial<Record<Preference, boolean>> = {}
  try { values = JSON.parse(raw) ?? {} } catch { /* Ignore invalid saved preferences. */ }
  const enabled = (name: Preference) => values[name] !== false
  function setEnabled(name: Preference, value: boolean) {
    localStorage.setItem(key, JSON.stringify({ ...values, [name]: value }))
    window.dispatchEvent(new Event(changeEvent))
  }
  return { enabled, setEnabled }
}
