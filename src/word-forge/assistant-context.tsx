import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type StoryAssistantContextValue = {
  context: string
  setContext: (context: string) => void
}

const StoryAssistantContext = createContext<StoryAssistantContextValue | null>(null)

export function StoryAssistantProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState('No story card is selected. Ask for broad story-building help.')
  const value = useMemo(() => ({ context, setContext }), [context])
  return <StoryAssistantContext.Provider value={value}>{children}</StoryAssistantContext.Provider>
}

export function useStoryAssistantContext() {
  const value = useContext(StoryAssistantContext)
  if (!value) throw new Error('useStoryAssistantContext must be used within StoryAssistantProvider')
  return value
}
