export type Stage = 'overview' | 'world' | 'characters' | 'plot' | 'chapters'

export type Genre = 'Fantasy' | 'Science Fiction' | 'Contemporary'

export type ElementSection = 'world' | 'characters' | 'plot'

export type CanonState = 'Canon' | 'Sketch'

export type Provenance = 'human' | 'ai_pending' | 'ai_accepted' | 'human_edited_ai'

export type SuggestionStatus = 'pending' | 'accepted' | 'deleted' | 'revising' | 'replaced'

export type ConsistencyStatus = 'Current' | 'Needs review'

export type ReferenceStatus = 'uploaded' | 'ready' | 'error'

export interface Project {
  title: string
  premise: string
  genre: Genre
  tone: string
  lessonsMorals: string
  timelineSpanDays: number
  targetPages: number
  readingLevel: 'Elementary' | 'Pre-teen' | 'Teen' | 'Adult'
  voiceTone: string
  pacing: string
  descriptionStyle: string
  dialogueStyle: string
  pointOfView: string
  styleNotes: string
  completedStages: Stage[]
  unlockedStages: Stage[]
  lastOpenStage?: Stage
  stageAttention: Partial<Record<Stage, boolean>>
  overallCoverage: number
}

export interface StoryElement {
  projectId: string
  section: ElementSection
  type: string
  title: string
  summary: string
  canonState: CanonState
  fields: Record<string, string>
  fieldTitles?: Record<string, string>
  fieldProvenance: Record<string, Provenance>
  relationships: string[]
  coverage: number
  version: number
  order: number
}

export interface Suggestion {
  projectId: string
  elementId: string
  fieldKey: string
  prompt: string
  proposedValue: string
  status: SuggestionStatus
  revisionInstruction: string
  replacesSuggestionId: string
  suggestionType?: 'field' | 'card'
  targetSection?: ElementSection
  proposedFields?: Record<string, string>
  proposedTitle?: string
  proposedSummary?: string
}

export interface Chapter {
  projectId: string
  title: string
  order: number
  objective: string
  synopsis: string
  body: string
  linkedElementIds: string[]
  dependencyVersions: Record<string, number>
  consistencyStatus: ConsistencyStatus
  lastReviewedAt: string
}

export interface Attachment {
  projectId: string
  elementId: string
  fileKey: string
  fileName: string
  mimeType: string
  caption: string
}

export interface Reference {
  projectId: string
  stage: Stage
  fileKey: string
  fileName: string
  mimeType: string
  size: number
  status: ReferenceStatus
}

export interface Trope {
  section: ElementSection
  name: string
  description: string
  genres: Genre[]
  followUps?: TropeFollowUp[]
}

export interface TropeFollowUp {
  section: ElementSection
  name: string
  description: string
  fields: Record<string, string>
}

export interface ElementTemplate {
  section: ElementSection
  type: string
  title: string
  summary: string
  fields: Record<string, string>
}
