/**
 * Example gated page. Reached at /settings — no auth logic lives here
 * because (protected)/_layout.tsx already wraps the subtree in <AuthGate>.
 */

import { signOut, useUser } from 'deepspace'
import { Button } from '@/components/ui'
import { TROPE_SECTIONS, useSuggestionPreferences } from '@/word-forge/preferences'

export default function SettingsPage() {
  const { user } = useUser()
  const { enabled, setEnabled } = useSuggestionPreferences()

  return (
    // No background on page wrappers — pages render into whatever the app's
    // (app)/_layout provides (a plain background, or a raised panel), so they
    // stay transparent and inherit it.
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="mb-12 text-4xl font-bold tracking-tight">Settings</h1>

        <section className="mb-8 border-y border-border py-6">
          <h2 className="mb-4 text-lg font-semibold">Suggestions</h2>
          {(['tropes', 'ai', ...TROPE_SECTIONS] as const).map((setting) => (
            <label key={setting} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>{setting === 'tropes' ? 'Trope suggestions' : setting === 'ai' ? 'Automatic AI suggestions' : `${setting[0].toUpperCase()}${setting.slice(1)} tropes`}</span>
              <input type="checkbox" role="switch" className="size-5 accent-primary" checked={enabled(setting)}
                disabled={setting !== 'tropes' && setting !== 'ai' && !enabled('tropes')}
                onChange={(event) => setEnabled(setting, event.target.checked)} />
            </label>
          ))}
        </section>
        <section className="border-t border-border py-6">
          <h2 className="mb-4 text-lg font-semibold">Your account</h2>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email ?? '—'}</dd>
            </div>
          </dl>

          <Button variant="secondary" className="mt-6" onClick={() => signOut()}>
            Sign out
          </Button>
        </section>
      </div>
    </div>
  )
}
