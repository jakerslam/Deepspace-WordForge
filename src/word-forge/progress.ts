import type { Chapter, Project, Stage, StoryElement } from './types'
import { STARTER_TEMPLATES, WORLD_TEMPLATES } from './templates'

const TEMPLATE_SUMMARIES = new Set(
  [...Object.values(WORLD_TEMPLATES).flat(), ...Object.values(STARTER_TEMPLATES).flat()].map((template) => template.summary),
)

export function isElementComplete(element: StoryElement): boolean {
  const summary = element.summary.trim()
  // Template summaries are instructional copy; authored or AI-proposed summaries count.
  return Object.values(element.fields).some((value) => value.trim()) || Boolean(summary && !TEMPLATE_SUMMARIES.has(summary))
}

export function elementCoverage(element: StoryElement): number {
  return isElementComplete(element) ? 100 : 0
}

export function isChapterComplete(chapter: Chapter): boolean {
  return Boolean(chapter.objective.trim() || chapter.synopsis.trim() || chapter.body.trim())
}

export function hasCharacterRole(elements: StoryElement[], role: 'protagonist' | 'antagonist'): boolean {
  return elements.some((element) => {
    if (element.section !== 'characters') return false
    const value = element.fields.role?.trim().toLowerCase() ?? ''
    return value === role || value.includes(role)
  })
}

export function stageCoverage(stage: Stage, project: Project, elements: StoryElement[]): number {
  if (stage === 'overview') {
    const fields = [project.title, project.premise, project.genre, project.lessonsMorals]
    return Math.round((fields.filter((field) => String(field).trim()).length / fields.length) * 100)
  }

  if (!(project.unlockedStages ?? ['overview']).includes(stage)) return 0

  if (stage === 'plot' && !project.timelineSpanDays) return 0
  if (stage === 'chapters') return 0

  const stageElements = elements.filter((element) => element.section === stage)
  if (stageElements.length === 0) return 0

  const completeElements = stageElements.filter(isElementComplete).length
  return Math.round((completeElements / stageElements.length) * 100)
}

export function canCompleteStage(stage: Stage, project: Project, elements: StoryElement[]): boolean {
  if (stage === 'overview') return stageCoverage(stage, project, elements) === 100
  if (stage === 'chapters') return true

  const stageElements = elements.filter((element) => element.section === stage)
  if (stage === 'plot' && !project.timelineSpanDays) return false
  if (stage === 'plot') return stageElements.some(isElementComplete)
  return stageElements.length > 0 && stageElements.every(isElementComplete)
}

export function validatedCompletedStages(project: Project, elements: StoryElement[]): Stage[] {
  const recorded = new Set(project.completedStages ?? [])
  const completed: Stage[] = []

  if (recorded.has('overview') && canCompleteStage('overview', project, elements)) completed.push('overview')
  if (recorded.has('world') && completed.includes('overview') && canCompleteStage('world', project, elements)) completed.push('world')
  if (recorded.has('characters') && completed.includes('world') && canCompleteStage('characters', project, elements)) completed.push('characters')
  if ((recorded.has('plot') || canCompleteStage('plot', project, elements)) && completed.includes('world') && canCompleteStage('plot', project, elements)) completed.push('plot')
  if (recorded.has('chapters') && completed.includes('plot')) completed.push('chapters')

  return completed
}

export function storyCoverage(project: Project, elements: StoryElement[], chapters: Chapter[]): number {
  const values = (['overview', 'world', 'characters', 'plot', 'chapters'] as Stage[]).map((stage) => {
    if (stage === 'chapters') {
      if (!(project.unlockedStages ?? ['overview']).includes(stage) || chapters.length === 0) return 0
      return Math.round((chapters.filter(isChapterComplete).length / chapters.length) * 100)
    }
    return stageCoverage(stage, project, elements)
  })
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function unlocksFor(completedStages: Stage[]): Stage[] {
  const unlocked = new Set<Stage>(['overview'])
  if (completedStages.includes('overview')) unlocked.add('world')
  if (completedStages.includes('world')) {
    unlocked.add('characters')
    unlocked.add('plot')
  }
  if (completedStages.includes('plot')) unlocked.add('chapters')
  return Array.from(unlocked)
}

export function nextStagesAfter(stage: Stage): Stage[] {
  if (stage === 'overview') return ['world']
  if (stage === 'world') return ['characters', 'plot']
  if (stage === 'characters' || stage === 'plot') return ['chapters']
  return []
}
