import type { CollectionSchema } from 'deepspace/schema'

const privateRecordPermissions = {
  viewer: { read: 'own', create: false, update: false, delete: false },
  member: { read: 'own', create: true, update: 'own', delete: 'own' },
  admin: { read: true, create: true, update: true, delete: true },
} satisfies CollectionSchema['permissions']

export const projectsSchema: CollectionSchema = {
  name: 'projects',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'premise', storage: 'text', interpretation: 'plain' },
    { name: 'genre', storage: 'text', interpretation: { kind: 'select', options: ['Fantasy', 'Science Fiction', 'Contemporary'] } },
    { name: 'tone', storage: 'text', interpretation: 'plain' },
    { name: 'lessonsMorals', storage: 'text', interpretation: 'plain' },
    { name: 'timelineSpanDays', storage: 'number', interpretation: 'plain' },
    { name: 'targetPages', storage: 'number', interpretation: 'plain' },
    { name: 'readingLevel', storage: 'text', interpretation: { kind: 'select', options: ['Elementary', 'Pre-teen', 'Teen', 'Adult'] } },
    { name: 'voiceTone', storage: 'text', interpretation: 'plain' },
    { name: 'pacing', storage: 'text', interpretation: 'plain' },
    { name: 'descriptionStyle', storage: 'text', interpretation: 'plain' },
    { name: 'dialogueStyle', storage: 'text', interpretation: 'plain' },
    { name: 'pointOfView', storage: 'text', interpretation: 'plain' },
    { name: 'styleNotes', storage: 'text', interpretation: 'plain' },
    { name: 'completedStages', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'unlockedStages', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'lastOpenStage', storage: 'text', interpretation: { kind: 'select', options: ['overview', 'world', 'characters', 'plot', 'chapters'] } },
    { name: 'stageAttention', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'overallCoverage', storage: 'number', interpretation: 'plain' },
  ],
  permissions: privateRecordPermissions,
}

export const elementsSchema: CollectionSchema = {
  name: 'elements',
  columns: [
    { name: 'projectId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'projects', displayColumn: 'title' } },
    { name: 'section', storage: 'text', interpretation: { kind: 'select', options: ['world', 'characters', 'plot'] } },
    { name: 'type', storage: 'text', interpretation: 'plain' },
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'canonState', storage: 'text', interpretation: { kind: 'select', options: ['Canon', 'Sketch'] } },
    { name: 'fields', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'fieldTitles', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'fieldProvenance', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'relationships', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'coverage', storage: 'number', interpretation: 'plain' },
    { name: 'version', storage: 'number', interpretation: 'plain' },
    { name: 'order', storage: 'number', interpretation: 'plain' },
  ],
  permissions: privateRecordPermissions,
}

export const suggestionsSchema: CollectionSchema = {
  name: 'suggestions',
  columns: [
    { name: 'projectId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'projects', displayColumn: 'title' } },
    { name: 'elementId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'elements', displayColumn: 'title' } },
    { name: 'fieldKey', storage: 'text', interpretation: 'plain' },
    { name: 'prompt', storage: 'text', interpretation: 'plain' },
    { name: 'proposedValue', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: ['pending', 'accepted', 'deleted', 'revising', 'replaced'] } },
    { name: 'revisionInstruction', storage: 'text', interpretation: 'plain' },
    { name: 'replacesSuggestionId', storage: 'text', interpretation: 'plain' },
    { name: 'suggestionType', storage: 'text', interpretation: { kind: 'select', options: ['field', 'card'] } },
    { name: 'targetSection', storage: 'text', interpretation: { kind: 'select', options: ['world', 'characters', 'plot'] } },
    { name: 'proposedFields', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'proposedTitle', storage: 'text', interpretation: 'plain' },
    { name: 'proposedSummary', storage: 'text', interpretation: 'plain' },
  ],
  permissions: privateRecordPermissions,
}

export const chaptersSchema: CollectionSchema = {
  name: 'chapters',
  columns: [
    { name: 'projectId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'projects', displayColumn: 'title' } },
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'order', storage: 'number', interpretation: 'plain' },
    { name: 'objective', storage: 'text', interpretation: 'plain' },
    { name: 'synopsis', storage: 'text', interpretation: 'plain' },
    { name: 'body', storage: 'text', interpretation: 'plain' },
    { name: 'linkedElementIds', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'dependencyVersions', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'consistencyStatus', storage: 'text', interpretation: { kind: 'select', options: ['Current', 'Needs review'] } },
    { name: 'lastReviewedAt', storage: 'text', interpretation: { kind: 'datetime' } },
  ],
  permissions: privateRecordPermissions,
}

export const attachmentsSchema: CollectionSchema = {
  name: 'attachments',
  columns: [
    { name: 'projectId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'projects', displayColumn: 'title' } },
    { name: 'elementId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'elements', displayColumn: 'title' } },
    { name: 'fileKey', storage: 'text', interpretation: 'plain' },
    { name: 'fileName', storage: 'text', interpretation: 'plain' },
    { name: 'mimeType', storage: 'text', interpretation: 'plain' },
    { name: 'caption', storage: 'text', interpretation: 'plain' },
  ],
  permissions: privateRecordPermissions,
}

export const referencesSchema: CollectionSchema = {
  name: 'references',
  columns: [
    { name: 'projectId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'projects', displayColumn: 'title' } },
    { name: 'stage', storage: 'text', interpretation: { kind: 'select', options: ['overview', 'world', 'characters', 'plot', 'chapters'] } },
    { name: 'fileKey', storage: 'text', interpretation: 'plain' },
    { name: 'fileName', storage: 'text', interpretation: 'plain' },
    { name: 'mimeType', storage: 'text', interpretation: 'plain' },
    { name: 'size', storage: 'number', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: ['uploaded', 'ready', 'error'] } },
  ],
  permissions: privateRecordPermissions,
}

export const tropesSchema: CollectionSchema = {
  name: 'tropes',
  columns: [
    { name: 'section', storage: 'text', interpretation: { kind: 'select', options: ['world', 'characters', 'plot'] } },
    { name: 'name', storage: 'text', interpretation: 'plain' },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'genres', storage: 'text', interpretation: { kind: 'json' } },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const wordForgeSchemas: CollectionSchema[] = [
  projectsSchema,
  elementsSchema,
  suggestionsSchema,
  chaptersSchema,
  attachmentsSchema,
  referencesSchema,
  tropesSchema,
]
