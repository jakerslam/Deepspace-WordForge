/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * That makes it cheap to serve and safe for logged-out / crawler traffic.
 *
 * The sidebar's logo mark links back here from inside the app; the button
 * below returns to the app — users move between the two freely.
 *
 * Need live data or auth here? Move this file to src/pages/(app)/index.tsx
 * and it becomes a dynamic page. Conversely, any page you want to keep static
 * (marketing, docs, legal) belongs at this top level.
 */

import { Link } from 'react-router-dom'
import { APP_NAME } from '../constants'

const LIVE_APP_URL = 'https://wordforge-jakerslam.app.space/home'
const isGitHubPagesPreview = import.meta.env.BASE_URL.includes('/Deepspace-WordForge/')

export default function Landing() {
  const appButtonClassName =
    'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'

  return (
    <div
      data-testid="static-landing"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p className="text-sm font-medium text-primary">{APP_NAME}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Build canon before prose.</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        A focused DeepSpace app for worldbuilding, character sheets, plot structure,
        reviewable AI suggestions, and chapter consistency.
      </p>
      {isGitHubPagesPreview ? (
        <a href={LIVE_APP_URL} className={appButtonClassName}>
          Open app
        </a>
      ) : (
        <Link to="/home" className={appButtonClassName}>
          Open app
        </Link>
      )}
    </div>
  )
}
