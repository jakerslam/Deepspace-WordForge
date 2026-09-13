import type { ElementTemplate, Genre, Provenance, Stage, StoryElement } from './types'

export const STAGES: Stage[] = ['overview', 'world', 'characters', 'plot', 'chapters']

export const STAGE_LABELS: Record<Stage, string> = {
  overview: 'Overview',
  world: 'World',
  characters: 'Characters',
  plot: 'Plot',
  chapters: 'Chapters',
}

export const GENRES: Genre[] = ['Fantasy', 'Science Fiction', 'Contemporary']

export const WORLD_TEMPLATES: Record<Genre, ElementTemplate[]> = {
  Fantasy: [
    {
      section: 'world',
      type: 'Magic system',
      title: 'Magic system',
      summary: 'Rules, costs, limits, and social consequences.',
      fields: {
        rules: '',
        limits: '',
        cost: '',
        whoCanUseIt: '',
      },
    },
    {
      section: 'world',
      type: 'Religion',
      title: 'Religions and beliefs',
      summary: 'Belief systems that shape behavior and conflict.',
      fields: {
        coreBeliefs: '',
        rituals: '',
        institutions: '',
        conflicts: '',
      },
    },
    {
      section: 'world',
      type: 'Location',
      title: 'Notable location',
      summary: 'A place that changes what characters can do.',
      fields: {
        description: '',
        culture: '',
        danger: '',
        storyUse: '',
      },
    },
  ],
  'Science Fiction': [
    {
      section: 'world',
      type: 'Technology',
      title: 'Core technology',
      summary: 'A technology that creates new choices and constraints.',
      fields: {
        capability: '',
        limitation: '',
        access: '',
        consequence: '',
      },
    },
    {
      section: 'world',
      type: 'Government',
      title: 'Government or faction',
      summary: 'Power structure that creates pressure on the story.',
      fields: {
        authority: '',
        agenda: '',
        publicImage: '',
        weakness: '',
      },
    },
    {
      section: 'world',
      type: 'Scientific constraint',
      title: 'Scientific constraint',
      summary: 'A rule that keeps the world from becoming anything-goes.',
      fields: {
        rule: '',
        evidence: '',
        exceptions: '',
        plotImpact: '',
      },
    },
  ],
  Contemporary: [
    {
      section: 'world',
      type: 'Location',
      title: 'Primary setting',
      summary: 'The ordinary world that shapes the cast.',
      fields: {
        description: '',
        socialTexture: '',
        constraints: '',
        storyUse: '',
      },
    },
    {
      section: 'world',
      type: 'Institution',
      title: 'Institution',
      summary: 'School, workplace, court, hospital, or other pressure system.',
      fields: {
        role: '',
        hierarchy: '',
        rules: '',
        conflict: '',
      },
    },
    {
      section: 'world',
      type: 'Relevant history',
      title: 'Relevant history',
      summary: 'The past event that still affects the present story.',
      fields: {
        event: '',
        whoRemembers: '',
        consequence: '',
        hiddenTruth: '',
      },
    },
  ],
}

export const STARTER_TEMPLATES: Record<'characters' | 'plot', ElementTemplate[]> = {
  characters: [
    {
      section: 'characters',
      type: 'Protagonist',
      title: 'Protagonist',
      summary: 'The person whose choices carry the story.',
      fields: {
        role: '',
        alignment: '',
        motivation: '',
        goal: '',
        strength: '',
        weakness: '',
        background: '',
        internalConflict: '',
      },
    },
    {
      section: 'characters',
      type: 'Antagonist',
      title: 'Antagonist',
      summary: 'A person, group, or pressure that meaningfully resists change.',
      fields: {
        role: '',
        alignment: '',
        motivation: '',
        goal: '',
        method: '',
        vulnerability: '',
        relationshipToProtagonist: '',
      },
    },
  ],
  plot: [
    {
      section: 'plot',
      type: 'Inciting incident',
      title: 'Inciting incident',
      summary: 'The event that makes the old life impossible.',
      fields: {
        description: '',
        cause: '',
        consequence: '',
        charactersInvolved: '',
        worldElementsInvolved: '',
        timelinePosition: '',
      },
    },
    {
      section: 'plot',
      type: 'Turning point',
      title: 'Major turning point',
      summary: 'A choice or reveal that changes the direction of the story.',
      fields: {
        description: '',
        pressure: '',
        decision: '',
        cost: '',
        newDirection: '',
        timelinePosition: '',
      },
    },
  ],
}

export function elementFromTemplate(projectId: string, template: ElementTemplate, order: number): StoryElement {
  const fieldProvenance: Record<string, Provenance> = Object.fromEntries(
    Object.keys(template.fields).map((field) => [field, 'human' as Provenance]),
  )

  return {
    projectId,
    section: template.section,
    type: template.type,
    title: template.title,
    summary: template.summary,
    canonState: 'Sketch',
    fields: template.fields,
    fieldProvenance,
    relationships: [],
    coverage: 0,
    version: 1,
    order,
  }
}
