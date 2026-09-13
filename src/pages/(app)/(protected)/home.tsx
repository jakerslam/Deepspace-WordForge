import { useEffect, useMemo, useRef, useState } from 'react'
import type { RecordData } from 'deepspace'
import { useLocation } from 'react-router-dom'
import { getAuthToken, useMutations, useQuery, useR2Files } from 'deepspace'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  FileText,
  Lightbulb,
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmModal,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Modal,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type {
  Chapter,
  ElementSection,
  Genre,
  Project,
  Stage,
  StoryElement,
  Suggestion,
  Attachment,
  Reference,
  Trope,
} from '@/word-forge/types'
import { elementCoverage, canCompleteStage, isElementComplete, stageCoverage, storyCoverage, unlocksFor, validatedCompletedStages } from '@/word-forge/progress'
import { useStoryAssistantContext } from '@/word-forge/assistant-context'
import {
  GENRES,
  STAGE_LABELS,
  STAGES,
  STARTER_TEMPLATES,
  WORLD_TEMPLATES,
  elementFromTemplate,
} from '@/word-forge/templates'
import { OVERVIEW_TROPES, tropesFor, type OverviewTrope } from '@/word-forge/tropes'
import { useSuggestionPreferences, type TropeSection } from '@/word-forge/preferences'

const SECTION_COPY: Record<ElementSection, string> = {
  world: 'Define the forces, places, and rules that later work depends on.',
  characters: 'Shape the people and pressures that make scenes move.',
  plot: 'Turn cause and consequence into an ordered story path.',
}

const VOICE_TONES = ['Lyrical', 'Direct', 'Tense', 'Warm', 'Dark', 'Playful', 'Strange']
const PACINGS = ['Brisk', 'Measured', 'Slow-burn', 'Variable']
const DESCRIPTION_STYLES = ['Sparse', 'Balanced', 'Vivid', 'Sensory']
const DIALOGUE_STYLES = ['Conversational', 'Witty', 'Formal', 'Understated', 'Raw']
const POINTS_OF_VIEW = ['First person', 'Close third person', 'Omniscient', 'Second person']
const ROLE_OPTIONS = ['Protagonist', 'Antagonist', 'Supporting', 'Mentor', 'Love interest']
const READING_LEVELS: Project['readingLevel'][] = ['Elementary', 'Pre-teen', 'Teen', 'Adult']

const FIELD_LABELS: Record<string, string> = {
  rules: 'Rules',
  limits: 'Limits',
  cost: 'Cost',
  whoCanUseIt: 'Who can use it',
  coreBeliefs: 'Core beliefs',
  rituals: 'Rituals',
  institutions: 'Institutions',
  conflicts: 'Conflicts',
  description: 'Description',
  culture: 'Culture',
  danger: 'Danger',
  storyUse: 'Story use',
  capability: 'Capability',
  limitation: 'Limitation',
  access: 'Access',
  consequence: 'Consequence',
  authority: 'Authority',
  agenda: 'Agenda',
  publicImage: 'Public image',
  weakness: 'Weakness',
  rule: 'Rule',
  evidence: 'Evidence',
  exceptions: 'Exceptions',
  plotImpact: 'Plot impact',
  socialTexture: 'Social texture',
  constraints: 'Constraints',
  role: 'Role',
  alignment: 'Alignment',
  hierarchy: 'Hierarchy',
  event: 'Event',
  whoRemembers: 'Who remembers',
  hiddenTruth: 'Hidden truth',
  motivation: 'Motivation',
  goal: 'Goal',
  strength: 'Strength',
  background: 'Background',
  internalConflict: 'Internal conflict',
  method: 'Method',
  vulnerability: 'Vulnerability',
  relationshipToProtagonist: 'Relationship to protagonist',
  cause: 'Cause',
  charactersInvolved: 'Characters involved',
  worldElementsInvolved: 'World elements involved',
  pressure: 'Pressure',
  decision: 'Decision',
  newDirection: 'New direction',
  timelinePosition: 'Timeline position',
}

export default function HomePage() {
  const location = useLocation()
  const { records: projectRecords, status: projectsStatus } = useQuery<Project>('projects', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })
  const { records: elementRecords } = useQuery<StoryElement>('elements', {
    orderBy: 'order',
    orderDir: 'asc',
  })
  const { records: suggestionRecords } = useQuery<Suggestion>('suggestions', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const { records: chapterRecords } = useQuery<Chapter>('chapters', {
    orderBy: 'order',
    orderDir: 'asc',
  })
  const { records: attachmentRecords } = useQuery<Attachment>('attachments', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const { records: referenceRecords } = useQuery<Reference>('references', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [newStoryRequested, setNewStoryRequested] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const requestedProject = params.get('project')
    if (requestedProject) setActiveProjectId(requestedProject)
    setNewStoryRequested(params.get('new') === '1')
  }, [location.search])
  const activeProject = useMemo(() => {
    return projectRecords.find((project) => project.recordId === activeProjectId) ?? projectRecords[0] ?? null
  }, [activeProjectId, projectRecords])

  const activeElements = useMemo(() => {
    if (!activeProject) return []
    return elementRecords.filter((element) => element.data.projectId === activeProject.recordId)
  }, [activeProject, elementRecords])

  const activeSuggestions = useMemo(() => {
    if (!activeProject) return []
    return suggestionRecords.filter((suggestion) => suggestion.data.projectId === activeProject.recordId)
  }, [activeProject, suggestionRecords])

  const activeChapters = useMemo(() => {
    if (!activeProject) return []
    return chapterRecords.filter((chapter) => chapter.data.projectId === activeProject.recordId)
  }, [activeProject, chapterRecords])

  if (projectsStatus === 'loading') {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading workspace...</div>
  }

  if (!activeProject) {
    return <ProjectDashboard projects={projectRecords} onOpen={setActiveProjectId} />
  }

  return (
    <Workspace
      project={activeProject}
      projects={projectRecords}
      elements={activeElements}
      suggestions={activeSuggestions}
      chapters={activeChapters}
      attachments={attachmentRecords.filter((attachment) => attachment.data.projectId === activeProject.recordId)}
      references={referenceRecords.filter((reference) => reference.data.projectId === activeProject.recordId)}
      onSwitchProject={setActiveProjectId}
      openNewStory={newStoryRequested}
      onNewStoryHandled={() => setNewStoryRequested(false)}
    />
  )
}

function ProjectDashboard({
  projects,
  onOpen,
}: {
  projects: RecordData<Project>[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-sm font-medium text-primary">Word Forge</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Build canon before prose.</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A DeepSpace workspace for bottom-up fiction planning: world, characters, plot,
          chapters, reviewable AI suggestions, and consistency checks.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <CreateProjectCard onOpen={onOpen} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <Badge variant="outline">{projects.length}</Badge>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm font-medium text-foreground">No story projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create one to seed genre-aware world cards.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {projects.map((project) => (
                <button
                  key={project.recordId}
                  type="button"
                  onClick={() => onOpen(project.recordId)}
                  className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{project.data.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.data.premise}</p>
                    </div>
                    <Badge variant="secondary">{project.data.genre}</Badge>
                  </div>
                  <ProgressLine value={project.data.overallCoverage ?? 0} className="mt-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateProjectCard({ onOpen }: { onOpen: (id: string) => void }) {
  const { create: createProject } = useMutations<Project>('projects')
  const { create: createElement } = useMutations<StoryElement>('elements')
  const { success } = useToast()
  const [title, setTitle] = useState('')
  const [premise, setPremise] = useState('')
  const [genre, setGenre] = useState<Genre>('Fantasy')

  async function handleCreate() {
    if (!title.trim() || !premise.trim()) return

    const projectId = await createProject({
      title: title.trim(),
      premise: premise.trim(),
      genre,
      tone: '',
      lessonsMorals: '',
      timelineSpanDays: 0,
      targetPages: 100,
      readingLevel: 'Adult',
      voiceTone: '',
      pacing: '',
      descriptionStyle: '',
      dialogueStyle: '',
      pointOfView: '',
      styleNotes: '',
      completedStages: [],
      unlockedStages: ['overview'],
      stageAttention: {},
      overallCoverage: 0,
    })

    await Promise.all(
      WORLD_TEMPLATES[genre].map((template, index) =>
        createElement(elementFromTemplate(projectId, template, index + 1)),
      ),
    )

    success('Project created', 'Overview is ready and World cards are waiting.')
    onOpen(projectId)
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">New story</h2>
      <div className="mt-4 space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The Ash Orchard" />
        </Field>
        <Field label="Premise">
          <Textarea
            value={premise}
            onChange={(event) => setPremise(event.target.value)}
            placeholder="A failed archivist discovers the empire's saints were engineered."
            className="min-h-24"
          />
        </Field>
        <Field label="Genre template">
          <Select value={genre} onValueChange={(value) => setGenre(value as Genre)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button onClick={handleCreate} disabled={!title.trim() || !premise.trim()} className="w-full">
          <Plus aria-hidden />
          Create project
        </Button>
      </div>
    </section>
  )
}

function Workspace({
  project,
  projects,
  elements,
  suggestions,
  chapters,
  attachments,
  references,
  onSwitchProject,
  openNewStory,
  onNewStoryHandled,
}: {
  project: RecordData<Project>
  projects: RecordData<Project>[]
  elements: RecordData<StoryElement>[]
  suggestions: RecordData<Suggestion>[]
  chapters: RecordData<Chapter>[]
  attachments: RecordData<Attachment>[]
  references: RecordData<Reference>[]
  onSwitchProject: (id: string) => void
  openNewStory: boolean
  onNewStoryHandled: () => void
}) {
  const [activeStage, setActiveStage] = useState<Stage>('overview')
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(openNewStory)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [dismissedLock, setDismissedLock] = useState<Stage | null>(null)
  const { setContext } = useStoryAssistantContext()
  const { put: putProject } = useMutations<Project>('projects')
  const selectedElement = elements.find((element) => element.recordId === selectedElementId) ?? null
  const validatedStages = useMemo(() => validatedCompletedStages(project.data, elements.map((element) => element.data)), [elements, project.data])
  const unlockedStages = useMemo(() => unlocksFor(validatedStages), [validatedStages])
  const currentStage: Stage = unlockedStages.includes(activeStage)
    ? activeStage
    : unlockedStages[unlockedStages.length - 1] as Stage
  const computedCoverage = storyCoverage(project.data, elements.map((element) => element.data), chapters.map((chapter) => chapter.data))

  useEffect(() => {
    if (openNewStory) {
      setIsNewStoryOpen(true)
      onNewStoryHandled()
    }
  }, [onNewStoryHandled, openNewStory])

  function updateProject(recordId: string, patch: Partial<Project>) {
    void putProject(recordId, patch)
  }

  function updateProjectCoverage(recordId: string, coverageValue: number) {
    void putProject(recordId, { overallCoverage: coverageValue })
  }

  useEffect(() => {
    if (computedCoverage !== project.data.overallCoverage) {
      void updateProjectCoverage(project.recordId, computedCoverage)
    }
  }, [computedCoverage, project.data.overallCoverage, project.recordId])

  useEffect(() => {
    const recordedCompleted = project.data.completedStages ?? []
    const recordedUnlocked = project.data.unlockedStages ?? []
    if (JSON.stringify(recordedCompleted) === JSON.stringify(validatedStages) && JSON.stringify(recordedUnlocked) === JSON.stringify(unlockedStages)) return
    void putProject(project.recordId, { completedStages: validatedStages, unlockedStages })
  }, [project.data.completedStages, project.data.unlockedStages, project.recordId, putProject, unlockedStages, validatedStages])

  useEffect(() => {
    const card = selectedElement
      ? `Selected card: ${selectedElement.data.title}\nCard type: ${selectedElement.data.type}\nSummary: ${selectedElement.data.summary || 'Empty'}\nFields:\n${Object.entries(selectedElement.data.fields).map(([key, value]) => `- ${key}: ${value || 'Empty'}`).join('\\n')}`
      : `No card selected. Story area: ${STAGE_LABELS[currentStage]}`
    setContext(`Project: ${project.data.title}\nGenre: ${project.data.genre}\nPremise: ${project.data.premise}\nLessons or morals: ${project.data.lessonsMorals ?? ''}\nTarget length: ${project.data.targetPages ?? 100} pages\nReading level: ${project.data.readingLevel ?? 'Adult'}\nVoice & Tone: ${project.data.voiceTone ?? ''}; ${project.data.pacing ?? ''} pacing; ${project.data.descriptionStyle ?? ''} description; ${project.data.dialogueStyle ?? ''} dialogue; ${project.data.pointOfView ?? ''}\n${card}`)
  }, [currentStage, project.data.dialogueStyle, project.data.descriptionStyle, project.data.genre, project.data.lessonsMorals, project.data.pacing, project.data.pointOfView, project.data.premise, project.data.readingLevel, project.data.targetPages, project.data.title, project.data.voiceTone, selectedElement, setContext])

  if (selectedElement) {
    return (
      <ElementEditor
        project={project}
        element={selectedElement}
        elements={elements}
        suggestions={suggestions.filter((suggestion) => suggestion.data.elementId === selectedElement.recordId)}
        chapters={chapters}
        attachments={attachments.filter((attachment) => attachment.data.elementId === selectedElement.recordId)}
        onBack={() => setSelectedElementId(null)}
      />
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{project.data.title}</h1>
              <Badge variant="secondary">{project.data.genre}</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{project.data.premise}</p>
          </div>
          <div className="flex min-w-72 flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Story Completion</span>
              <span>{project.data.overallCoverage ?? 0}%</span>
            </div>
            <ProgressLine value={project.data.overallCoverage ?? 0} />
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border px-5 py-2" aria-label="Story sections">
        {STAGES.map((stage) => {
          const locked = !unlockedStages.includes(stage)
          const active = currentStage === stage
          return <div key={stage} className="group relative">
            <button
              type="button"
              disabled={locked}
              onClick={() => setActiveStage(stage)}
              onMouseEnter={() => { if (locked) setDismissedLock(null) }}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                locked && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground',
              )}
            >
              {locked && <Lock className="size-3.5" aria-hidden />}
              {STAGE_LABELS[stage]}
            </button>
            {locked && dismissedLock !== stage && <div role="status" className="pointer-events-none absolute left-1/2 top-11 z-20 hidden w-48 -translate-x-1/2 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:block group-focus-within:block">
              <button type="button" aria-label="Close blocker" title="Close blocker" onClick={() => setDismissedLock(stage)} className="pointer-events-auto absolute right-1 top-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" aria-hidden /></button>
              <p className="pr-4 font-medium">{STAGE_LABELS[stage]} locked</p>
              <p className="mt-1 pr-2 text-muted-foreground">{stage === 'chapters' ? 'Finish Characters and Plot first.' : `Finish ${stage === 'characters' || stage === 'plot' ? 'World' : STAGE_LABELS[STAGES[STAGES.indexOf(stage) - 1]]} first.`}</p>
            </div>}
          </div>
        })}
      </nav>

      <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-5">
        {currentStage === 'overview' ? (
          <OverviewStage
            project={project}
            elements={elements}
            references={references}
            onCompleted={(completedStages) => setActiveStage(nextStageAfterCompletion('overview', completedStages))}
          />
        ) : currentStage === 'chapters' ? (
          <ChaptersStage project={project} elements={elements} chapters={chapters} references={references} />
        ) : (
          <ElementStage
            stage={currentStage as ElementSection}
            project={project}
            elements={elements.filter((element) => element.data.section === currentStage)}
            allElements={elements}
            references={references}
            onOpen={setSelectedElementId}
            onCompleted={(stage, completedStages) => setActiveStage(nextStageAfterCompletion(stage, completedStages))}
          />
        )}
      </main>
      <Modal open={isNewStoryOpen} onClose={() => setIsNewStoryOpen(false)} size="md">
        <Modal.Header><Modal.Title>New story</Modal.Title></Modal.Header>
        <Modal.Body><CreateProjectCard onOpen={(id) => { setIsNewStoryOpen(false); onSwitchProject(id) }} /></Modal.Body>
      </Modal>
    </div>
  )
}

function PhaseHeader({
  title,
  description,
  collapsible,
  collapsed,
  onToggle,
}: {
  title: string
  description?: string
  collapsible: boolean
  collapsed: boolean
  onToggle: () => void
}) {
  const Icon = collapsed ? ChevronDown : ChevronUp

  return (
    <button
      type="button"
      disabled={!collapsible}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between gap-4 p-4 text-left transition-colors',
        collapsible && 'hover:bg-accent',
        !collapsible && 'cursor-default',
      )}
      aria-expanded={collapsible ? !collapsed : undefined}
    >
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {collapsible && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
    </button>
  )
}

function OverviewStage({
  project,
  elements,
  references,
  onCompleted,
}: {
  project: RecordData<Project>
  elements: RecordData<StoryElement>[]
  references: RecordData<Reference>[]
  onCompleted: (completedStages: Stage[]) => void
}) {
  const { put } = useMutations<Project>('projects')
  const { success } = useToast()
  const coverage = stageCoverage('overview', project.data, elements.map((element) => element.data))
  const [overviewDraft, setOverviewDraft] = useState({ title: project.data.title, premise: project.data.premise, genre: project.data.genre, lessonsMorals: project.data.lessonsMorals ?? '' })
  const overviewReady = Boolean(overviewDraft.title.trim() && overviewDraft.premise.trim() && overviewDraft.genre.trim())
  const [overviewPhaseOneCollapsed, setOverviewPhaseOneCollapsed] = useState(false)
  const overviewTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    setOverviewDraft({ title: project.data.title, premise: project.data.premise, genre: project.data.genre, lessonsMorals: project.data.lessonsMorals ?? '' })
    setOverviewPhaseOneCollapsed(false)
  }, [project.recordId])

  function persistOverview(key: keyof Project, value: string) {
    const previous = overviewTimers.current[key]
    if (previous) clearTimeout(previous)
    overviewTimers.current[key] = setTimeout(() => { void put(project.recordId, { [key]: value }) }, 250)
  }

  useEffect(() => {
    if (!project.data.completedStages.includes('overview') && canCompleteStage('overview', project.data, elements.map((element) => element.data))) {
      void completeOverview()
    }
  }, [elements, project])

  useEffect(() => {
    setOverviewPhaseOneCollapsed(overviewReady)
  }, [overviewReady])

  async function completeOverview() {
    const completedStages = Array.from(new Set([...project.data.completedStages, 'overview' as Stage]))
    await put(project.recordId, {
      completedStages,
      unlockedStages: unlocksFor(completedStages),
      overallCoverage: coverage,
    })
    success('Overview complete', 'Opening World now.')
    onCompleted(completedStages)
  }

  function useTrope(trope: OverviewTrope) {
    if (overviewDraft.premise.includes(trope.description)) return
    const premise = [overviewDraft.premise.trim(), trope.description].filter(Boolean).join('\n\n')
    setOverviewDraft((draft) => ({ ...draft, premise }))
    persistOverview('premise', premise)
  }

  return (
    <div className="grid gap-5">
      <ReferenceFiles projectId={project.recordId} stage="overview" references={references} />
      <OverviewTropes genre={project.data.genre} onUse={useTrope} />
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <PhaseHeader
          title="Stage 1: Overview"
          description={overviewPhaseOneCollapsed ? 'Completed stage collapsed.' : undefined}
          collapsible={overviewReady}
          collapsed={overviewPhaseOneCollapsed}
          onToggle={() => setOverviewPhaseOneCollapsed((collapsed) => !collapsed)}
        />
        {!overviewPhaseOneCollapsed && (
          <div className="border-t border-border p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title"><Input value={overviewDraft.title} onChange={(event) => { const value = event.target.value; setOverviewDraft((draft) => ({ ...draft, title: value })); persistOverview('title', value) }} /></Field>
              <Field label="Genre">
                <Select value={overviewDraft.genre} onValueChange={(value) => { setOverviewDraft((draft) => ({ ...draft, genre: value as Project['genre'] })); persistOverview('genre', value) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GENRES.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Overview description" className="md:col-span-2"><Textarea value={overviewDraft.premise} onChange={(event) => { const value = event.target.value; setOverviewDraft((draft) => ({ ...draft, premise: value })); persistOverview('premise', value) }} className="min-h-24" /></Field>
              <div className="flex items-end text-sm text-muted-foreground">Overview coverage: {coverage}%</div>
            </div>
          </div>
        )}
      </section>
      <section className={cn('overflow-hidden rounded-lg border border-border bg-card transition-opacity duration-300', !overviewReady && 'pointer-events-none opacity-0')}>
        <PhaseHeader
          title="Stage 2: Lessons & morals"
          collapsible={false}
          collapsed={false}
          onToggle={() => {}}
        />
        <div className="border-t border-border p-5">
          <div>
            <Field label="Lessons & morals"><Textarea value={overviewDraft.lessonsMorals} onChange={(event) => { const value = event.target.value; setOverviewDraft((draft) => ({ ...draft, lessonsMorals: value })); persistOverview('lessonsMorals', value) }} placeholder="What should this story leave the reader thinking about?" className="min-h-20" /></Field>
          </div>
        </div>
      </section>
    </div>
  )
}

function ElementStage({
  stage,
  project,
  elements,
  allElements,
  references,
  onOpen,
  onCompleted,
}: {
  stage: ElementSection
  project: RecordData<Project>
  elements: RecordData<StoryElement>[]
  allElements: RecordData<StoryElement>[]
  references: RecordData<Reference>[]
  onOpen: (id: string) => void
  onCompleted: (stage: ElementSection, completedStages: Stage[]) => void
}) {
  const { create } = useMutations<StoryElement>('elements')
  const { put: putProject } = useMutations<Project>('projects')
  const { create: createSuggestion, put: putSuggestion, remove: removeSuggestion } = useMutations<Suggestion>('suggestions')
  const { success } = useToast()
  const [openIdeaId, setOpenIdeaId] = useState<string | null>(null)
  const [timelineCollapsed, setTimelineCollapsed] = useState(false)
  const requestedIdeaIds = useRef(new Set<string>())
  const { enabled } = useSuggestionPreferences()
  const aiEnabled = enabled('ai')
  const completionTriggered = useRef(false)
  const { records: stageSuggestions } = useQuery<Suggestion>('suggestions', {
    where: { projectId: project.recordId },
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const coverage = stageCoverage(stage, project.data, allElements.map((element) => element.data))
  const cardIdeas = stageSuggestions.filter((item) => item.data.suggestionType === 'card' && item.data.status === 'pending' && (!item.data.targetSection || item.data.targetSection === stage))
  const setupReady = stage === 'plot' ? Boolean(project.data.timelineSpanDays) : true

  useEffect(() => {
    if (!setupReady || !aiEnabled) return
    const controller = new AbortController()
    if (stageSuggestions.some((suggestion) => suggestion.data.suggestionType === 'card' && suggestion.data.status === 'pending')) return
    const candidate = elements.find((item) => {
      if (elementCoverage(item.data) === 100 || requestedIdeaIds.current.has(item.recordId)) return false
      return !stageSuggestions.some((suggestion) => suggestion.data.elementId === item.recordId && suggestion.data.status === 'pending')
    })
    if (!candidate) return
    requestedIdeaIds.current.add(candidate.recordId)
    const hasAcceptedIdea = stageSuggestions.some((suggestion) => suggestion.data.elementId === candidate.recordId && suggestion.data.status === 'accepted')
    void createStoryIdea(project, candidate, createSuggestion, hasAcceptedIdea, controller.signal)
      .catch(() => {})
      .finally(() => requestedIdeaIds.current.delete(candidate.recordId))
    return () => controller.abort()
  }, [aiEnabled, createSuggestion, elements, project, setupReady, stageSuggestions])

  useEffect(() => {
    if (stage === 'plot' && setupReady) setTimelineCollapsed(true)
  }, [setupReady, stage])

  useEffect(() => {
    const ready = canCompleteStage(stage, project.data, allElements.map((element) => element.data))
    if (ready && !project.data.completedStages.includes(stage) && !completionTriggered.current) {
      completionTriggered.current = true
      void completeStage()
    }
  }, [allElements, project, stage])

  async function addBlankElement() {
    const nextOrder = Math.max(0, ...elements.map((element) => element.data.order)) + 1
    const title = stage === 'characters' ? 'New character' : stage === 'plot' ? 'New plot point' : 'New world element'
    await create({
      projectId: project.recordId,
      section: stage,
      type: stage === 'characters' ? 'Character' : stage === 'plot' ? 'Plot point' : 'World element',
      title,
      summary: '',
      canonState: 'Sketch',
      fields: stage === 'characters'
        ? { role: '', alignment: '', motivation: '', goal: '', weakness: '', background: '' }
        : stage === 'plot'
          ? { description: '', cause: '', consequence: '' }
          : { description: '', storyUse: '' },
      fieldProvenance: {},
      relationships: [],
      coverage: 0,
      version: 1,
      order: nextOrder,
    })
  }

  async function addTimelineEvent(days: number, detail?: { title: string; summary: string }) {
    const nextOrder = Math.max(0, ...elements.map((element) => element.data.order)) + 1
    const eventId = await create({
      projectId: project.recordId,
      section: 'plot',
      type: 'Plot point',
      title: detail?.title || 'New plot point',
      summary: detail?.summary || '',
      canonState: 'Sketch',
      fields: { description: detail?.summary || '', cause: '', consequence: '', timelinePosition: String(Math.round(days * 100) / 100) },
      fieldProvenance: {},
      relationships: [],
      coverage: 0,
      version: 1,
      order: nextOrder,
    })
    onOpen(eventId)
  }

  async function useTrope(trope: Trope) {
    await create({
      projectId: project.recordId,
      section: stage,
      type: `Trope: ${trope.name}`,
      title: trope.name,
      summary: trope.description,
      canonState: 'Sketch',
      fields: stage === 'characters' ? { role: '', alignment: '', motivation: '', goal: '', weakness: '', background: '' } : stage === 'plot' ? { description: '', cause: '', consequence: '' } : { description: '', storyUse: '' },
      fieldProvenance: {},
      relationships: [],
      coverage: 0,
      version: 1,
      order: Math.max(0, ...elements.map((element) => element.data.order)) + 1,
    })
    if (trope.followUps?.length) {
      await Promise.all(trope.followUps.map((followUp) => createSuggestion({
        projectId: project.recordId,
        elementId: '',
        fieldKey: '__card__',
        prompt: `Follow-up from the ${trope.name} trope`,
        proposedValue: followUp.description,
        status: 'pending',
        revisionInstruction: '',
        replacesSuggestionId: '',
        suggestionType: 'card',
        targetSection: followUp.section,
        proposedFields: followUp.fields,
        proposedTitle: followUp.name,
        proposedSummary: followUp.description,
      })))
    }
    success('Trope added', `${trope.name} is now a Sketch card.`)
  }

  async function acceptCardIdea(idea: RecordData<Suggestion>) {
    await create({
      projectId: project.recordId,
      section: stage,
      type: `Suggested ${stage} card`,
      title: idea.data.proposedTitle || 'New story element',
      summary: idea.data.proposedSummary || idea.data.proposedValue,
      canonState: 'Sketch',
      fields: idea.data.proposedFields ?? (stage === 'characters' ? { role: '', alignment: '', motivation: '', goal: '', weakness: '', background: '' } : stage === 'plot' ? { description: '', cause: '', consequence: '' } : { description: '', storyUse: '' }),
      fieldProvenance: {},
      relationships: [],
      coverage: 0,
      version: 1,
      order: Math.max(0, ...elements.map((element) => element.data.order)) + 1,
    })
    await putSuggestion(idea.recordId, { status: 'accepted' })
    success('Card idea accepted', 'A new Sketch card was added.')
  }

  async function completeStage() {
    const completedStages = Array.from(new Set([
      ...validatedCompletedStages(project.data, allElements.map((element) => element.data)),
      stage,
    ]))
    const unlockedStages = Array.from(new Set([...project.data.unlockedStages, ...unlocksFor(completedStages)]))

    if (stage === 'world') {
      const sections = new Set(allElements.map((element) => element.data.section))
      const createStarters = []
      if (!sections.has('characters')) {
        createStarters.push(...STARTER_TEMPLATES.characters.map((template, index) => create(elementFromTemplate(project.recordId, template, index + 1))))
      }
      if (!sections.has('plot')) {
        createStarters.push(...STARTER_TEMPLATES.plot.map((template, index) => create(elementFromTemplate(project.recordId, template, index + 1))))
      }
      await Promise.all(createStarters)
    }

    await putProject(project.recordId, {
      completedStages,
      unlockedStages,
      overallCoverage: Math.round((project.data.overallCoverage + coverage) / 2),
    })
    const nextStage = nextStageAfterCompletion(stage, completedStages)
    const nextLabel = STAGE_LABELS[nextStage]
    success(
      `${STAGE_LABELS[stage]} complete`,
      stage === 'world'
        ? 'Characters and Plot are unlocked. Opening Characters now.'
        : `Opening ${nextLabel} now.`,
    )
    onCompleted(stage, completedStages)
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-hidden">
      <ReferenceFiles projectId={project.recordId} stage={stage} references={references} />
      {stage === 'plot' && (
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
          <PhaseHeader
            title="Stage 1: Timespan"
            description={timelineCollapsed ? 'Completed stage collapsed.' : undefined}
            collapsible={setupReady}
            collapsed={timelineCollapsed}
            onToggle={() => setTimelineCollapsed((collapsed) => !collapsed)}
          />
          {!timelineCollapsed && <div className="border-t border-border [&>section]:rounded-none [&>section]:border-0"><PlotTimeline project={project} /></div>}
        </section>
      )}
      <section className={cn('min-w-0 transition-opacity duration-300', stage === 'plot' && 'rounded-lg border border-border bg-card p-4', stage === 'plot' && !setupReady && 'pointer-events-none opacity-0')}>
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', stage === 'plot' && '-mx-4 -mt-4 mb-4 border-b border-border p-4')}>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{stage === 'plot' ? 'Stage 2: Plot elements' : STAGE_LABELS[stage]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{SECTION_COPY[stage]}</p>
          </div>
          <Button variant="outline" onClick={addBlankElement} disabled={!setupReady}>
            <Plus aria-hidden />
            Add card
          </Button>
        </div>

        {setupReady && <TropeSuggestions stage={stage} genre={project.data.genre} hasWrittenContent={elements.some((element) => isElementComplete(element.data))} onUse={useTrope} />}

        {stage === 'plot' ? <PlotEventTimeline project={project} elements={elements} onOpen={onOpen} onAddEvent={addTimelineEvent} aiEnabled={aiEnabled} /> : <div className={cn('mt-5 grid gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3', !setupReady && 'pointer-events-none opacity-0')}>
          {aiEnabled && cardIdeas.map((idea) => (
            <article key={idea.recordId} className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{idea.data.proposedTitle || 'Card idea'}</h3>
                <Lightbulb className="size-4 shrink-0 text-amber-500" aria-label="AI card idea" />
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{idea.data.proposedSummary || idea.data.proposedValue}</p>
              <div className="mt-5 flex justify-end gap-1">
                <IconButton label="Dismiss card idea" onClick={() => removeSuggestion(idea.recordId)}><X aria-hidden /></IconButton>
                <IconButton label="Accept card idea" onClick={() => { void acceptCardIdea(idea) }}><Check aria-hidden /></IconButton>
              </div>
            </article>
          ))}
          {elements.map((element) => {
            const idea = stageSuggestions.find((item) => item.data.elementId === element.recordId && item.data.status === 'pending')
            const hasAiUpdate = Object.values(element.data.fieldProvenance ?? {}).some((value) => value.startsWith('ai'))
            return (
            <article
              key={element.recordId}
              onClick={() => onOpen(element.recordId)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(element.recordId) }}
              tabIndex={0}
              className="relative min-h-48 cursor-pointer rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{element.data.type}</p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{element.data.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {aiEnabled && idea && <div className="relative">
                    <button type="button" aria-label="View AI idea" title="View AI idea" onClick={(event) => { event.stopPropagation(); setOpenIdeaId(openIdeaId === element.recordId ? null : element.recordId) }} className="flex size-7 items-center justify-center rounded-md text-amber-500 hover:bg-amber-500/10"><Lightbulb className="size-4" aria-hidden /></button>
                    {openIdeaId === element.recordId && <div className="absolute right-0 top-9 z-10 w-64 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md">
                      <button type="button" aria-label="Close idea" title="Close idea" onClick={() => setOpenIdeaId(null)} className="absolute right-1 top-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" aria-hidden /></button>
                      <p className="pr-4">{idea.data.proposedValue}</p>
                      <p className="mt-2 text-muted-foreground">Open the card to review and accept it.</p>
                    </div>}
                  </div>}
                  {hasAiUpdate && <span className="size-2 rounded-full bg-blue-500" title="Contains collaborator or AI updates" aria-label="Contains collaborator or AI updates" />}
                  <Badge variant={element.data.canonState === 'Canon' ? 'success' : 'outline'}>{element.data.canonState}</Badge>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {element.data.summary || firstFilledField(element.data) || 'Open this card and type directly into its fields.'}
              </p>
            </article>
            )
          })}
        </div>}
      </section>
    </div>
  )
}

function ElementEditor({
  project,
  element,
  elements,
  suggestions,
  chapters,
  attachments,
  onBack,
}: {
  project: RecordData<Project>
  element: RecordData<StoryElement>
  elements: RecordData<StoryElement>[]
  suggestions: RecordData<Suggestion>[]
  chapters: RecordData<Chapter>[]
  attachments: RecordData<Attachment>[]
  onBack: () => void
}) {
  const { put: putElement, remove: removeElement } = useMutations<StoryElement>('elements')
  const { create: createSuggestion, put: putSuggestion, remove: removeSuggestion } = useMutations<Suggestion>('suggestions')
  const { put: putChapter } = useMutations<Chapter>('chapters')
  const { create: createAttachment, put: putAttachment, remove: removeAttachment } = useMutations<Attachment>('attachments')
  const { upload, getUrl, isUploading } = useR2Files()
  const { success } = useToast()
  const [revisionText, setRevisionText] = useState('')
  const [titleDraft, setTitleDraft] = useState(element.data.title)
  const [summaryDraft, setSummaryDraft] = useState(element.data.summary)
  const [fieldDrafts, setFieldDrafts] = useState(element.data.fields)
  const initialPlotPosition = useRef(element.data.fields.timelinePosition ?? '')
  const [newFieldTitle, setNewFieldTitle] = useState('')
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const plotSpan = effectiveTimelineSpan(project.data.timelineSpanDays)
  const plotUnit = timelineUnit(plotSpan)
  const plotTimeUnits = storyTimelineUnits(plotSpan)
  const eventPosition = Number(fieldDrafts.timelinePosition || '')
  const eventDays = Number.isFinite(eventPosition) ? Math.max(0, Math.min(plotSpan, eventPosition)) : 0
  const eventTimeParts = timelineParts(eventDays, plotTimeUnits)

  useEffect(() => {
    setTitleDraft(element.data.title)
    setSummaryDraft(element.data.summary)
    setFieldDrafts(element.data.fields)
    initialPlotPosition.current = element.data.fields.timelinePosition ?? ''
  }, [element.recordId])

  async function leaveEditor() {
    const hasPlotContent = element.data.section === 'plot' && (
      titleDraft !== 'New plot point'
      || Boolean(summaryDraft.trim())
      || (fieldDrafts.timelinePosition ?? '') !== initialPlotPosition.current
      || Object.entries(fieldDrafts).some(([key, value]) => key !== 'timelinePosition' && Boolean(value.trim()))
    )
    if (element.data.section === 'plot' && !hasPlotContent) {
      await removeElement(element.recordId)
    }
    onBack()
  }

  function persistDraft(key: string, patch: Partial<StoryElement>) {
    const previous = draftTimers.current[key]
    if (previous) clearTimeout(previous)
    draftTimers.current[key] = setTimeout(() => { void patchElement(patch) }, 250)
  }

  async function patchElement(patch: Partial<StoryElement>) {
    const nextVersion = element.data.version + 1
    await putElement(element.recordId, { ...patch, version: nextVersion })
    await Promise.all(
      chapters
        .filter((chapter) => chapter.data.linkedElementIds.includes(element.recordId))
        .map((chapter) => putChapter(chapter.recordId, { consistencyStatus: 'Needs review' })),
    )
  }

  async function updateField(fieldKey: string, value: string) {
    const fields = { ...element.data.fields, [fieldKey]: value }
    const fieldProvenance: StoryElement['fieldProvenance'] = {
      ...element.data.fieldProvenance,
      [fieldKey]: element.data.fieldProvenance[fieldKey]?.startsWith('ai') ? 'human_edited_ai' : 'human',
    }
    await patchElement({
      fields,
      fieldProvenance,
      coverage: elementCoverage({ ...element.data, fields }),
      summary: element.data.summary || value.slice(0, 140),
    })
  }

  function draftFieldChange(fieldKey: string, nextValue: string) {
    const nextFields = { ...fieldDrafts, [fieldKey]: nextValue }
    const nextProvenance: StoryElement['fieldProvenance'] = {
      ...element.data.fieldProvenance,
      [fieldKey]: element.data.fieldProvenance[fieldKey]?.startsWith('ai') ? 'human_edited_ai' : 'human',
    }
    setFieldDrafts(nextFields)
    persistDraft(`field:${fieldKey}`, { fields: nextFields, fieldProvenance: nextProvenance, coverage: elementCoverage({ ...element.data, fields: nextFields }) })
  }

  function updateEventTimePart(unit: typeof TIME_UNITS[number], value: string) {
    const nextValue = Math.max(0, Number(value) || 0)
    const nextDays = plotTimeUnits.reduce((total, part) => total + (part.label === unit.label ? nextValue : eventTimeParts[part.label]) * part.days, 0)
    draftFieldChange('timelinePosition', String(Math.min(plotSpan, nextDays)))
  }

  async function requestSuggestion(fieldKey: string) {
    const current = element.data.fields[fieldKey] || ''
    await createSuggestion({
      projectId: project.recordId,
      elementId: element.recordId,
      fieldKey,
      prompt: `Improve ${fieldLabel(fieldKey)} for ${element.data.title}`,
      proposedValue: current
        ? `${current}\n\nSuggested angle: connect this detail more directly to ${project.data.premise}`
        : `Draft a concrete ${fieldLabel(fieldKey).toLowerCase()} for ${element.data.title} that supports: ${project.data.premise}`,
      status: 'pending',
      revisionInstruction: '',
      replacesSuggestionId: '',
    })
    success('Suggestion drafted', 'Review it before it becomes canon.')
  }

  async function addField(title: string) {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const baseKey = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`
    let key = baseKey
    let index = 2
    while (Object.prototype.hasOwnProperty.call(element.data.fields, key)) key = `${baseKey}_${index++}`
    const fields = { ...element.data.fields, [key]: '' }
    await patchElement({ fields, fieldTitles: { ...(element.data.fieldTitles ?? {}), [key]: cleanTitle }, coverage: elementCoverage({ ...element.data, fields }) })
    setFieldDrafts(fields)
    setNewFieldTitle('')
  }

  async function deleteField(fieldKey: string) {
    const fields = { ...element.data.fields }
    const fieldTitles = { ...(element.data.fieldTitles ?? {}) }
    delete fields[fieldKey]
    delete fieldTitles[fieldKey]
    await patchElement({ fields, fieldTitles, coverage: elementCoverage({ ...element.data, fields }) })
    setFieldDrafts(fields)
  }

  async function acceptSuggestion(suggestion: RecordData<Suggestion>) {
    if (suggestion.data.fieldKey === '__new__') {
      const title = suggestion.data.proposedTitle?.trim() || 'New story detail'
      const baseKey = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`
      let key = baseKey
      let index = 2
      while (Object.prototype.hasOwnProperty.call(element.data.fields, key)) key = `${baseKey}_${index++}`
      const fields = { ...element.data.fields, [key]: suggestion.data.proposedValue }
      await patchElement({
        fields,
        fieldTitles: { ...(element.data.fieldTitles ?? {}), [key]: title },
        fieldProvenance: { ...element.data.fieldProvenance, [key]: 'ai_accepted' },
        coverage: elementCoverage({ ...element.data, fields }),
      })
      setFieldDrafts(fields)
    } else {
      await updateField(suggestion.data.fieldKey, suggestion.data.proposedValue)
    }
    await putSuggestion(suggestion.recordId, { status: 'accepted' })
    success('Suggestion accepted')
  }

  async function reviseSuggestion(suggestion: RecordData<Suggestion>) {
    if (!revisionText.trim()) return
    const revisedId = await createSuggestion({
      ...suggestion.data,
      proposedValue: `${suggestion.data.proposedValue}\n\nRevision: ${revisionText.trim()}`,
      revisionInstruction: revisionText.trim(),
      status: 'pending',
      replacesSuggestionId: suggestion.recordId,
    })
    await putSuggestion(suggestion.recordId, { status: 'replaced' })
    setRevisionText('')
    success('Revision created', `New suggestion ${revisedId} is ready.`)
  }

  async function confirmDeleteCard() {
    setIsDeleting(true)
    await removeElement(element.recordId)
    setIsDeleting(false)
    setShowDeleteModal(false)
    success('Card deleted')
    onBack()
  }

  async function uploadReferenceImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await upload(file, file.name)
    if (!result.success || !result.key) return

    await createAttachment({
      projectId: project.recordId,
      elementId: element.recordId,
      fileKey: result.key,
      fileName: file.name,
      mimeType: file.type,
      caption: '',
    })
    success('Reference image attached')
    event.target.value = ''
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-5 py-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => { void leaveEditor() }}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          <Trash2 aria-hidden />
          Delete
        </Button>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { void confirmDeleteCard() }}
        title={`Delete ${element.data.title}?`}
        description="This permanently removes the card from the story workspace."
        confirmText="Delete card"
        loading={isDeleting}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <Field label="Title">
              <Input value={titleDraft} onChange={(event) => { setTitleDraft(event.target.value); persistDraft('title', { title: event.target.value }) }} />
            </Field>
            <Field label="Status">
              <Select
                value={element.data.canonState}
                onValueChange={(value) => patchElement({ canonState: value as StoryElement['canonState'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sketch">Sketch</SelectItem>
                  <SelectItem value="Canon">Canon</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Card overview" className="mt-4">
            <Textarea
              value={summaryDraft}
              onChange={(event) => { setSummaryDraft(event.target.value); persistDraft('summary', { summary: event.target.value }) }}
              className="min-h-24"
            />
          </Field>

          {element.data.section === 'plot' && (
            <div className="mt-5 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3"><Label>Timeline placement</Label><span className="text-xs text-muted-foreground">{formatTimelineTimestamp(eventDays, plotTimeUnits)}</span></div>
              <input type="range" min="0" max="1000" step="1" value={Math.round((eventDays / plotSpan) * 1000)} onChange={(event) => draftFieldChange('timelinePosition', String((Number(event.target.value) / 1000) * plotSpan))} aria-label="Place event on story timeline" className="mt-3 w-full accent-primary" />
              <div className="mt-3 flex flex-wrap items-end gap-2">
                {plotTimeUnits.map((unit) => <Field key={unit.label} label={unit.label} className="w-20"><Input type="number" min="0" step="1" value={String(eventTimeParts[unit.label])} onChange={(event) => updateEventTimePart(unit, event.target.value)} aria-label={`Event ${unit.label}`} /></Field>)}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{element.data.title} fields</h2>
              <p className="mt-1 text-xs text-muted-foreground">Templates are starting points. Add the details this story needs.</p>
            </div>
            <div className="flex gap-2">
              <Input value={newFieldTitle} onChange={(event) => setNewFieldTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addField(newFieldTitle) }} placeholder="New field title" className="h-9 w-44" />
              <Button variant="outline" size="sm" onClick={() => { void addField(newFieldTitle) }} disabled={!newFieldTitle.trim()}><Plus aria-hidden /> Add field</Button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {Object.entries(element.data.fields).filter(([fieldKey]) => !(element.data.section === 'plot' && fieldKey === 'timelinePosition')).map(([fieldKey]) => {
              const pending = suggestions.find((suggestion) => {
                return suggestion.data.fieldKey === fieldKey && suggestion.data.status === 'pending'
              })
              return (
                <div key={fieldKey} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Label>{element.data.fieldTitles?.[fieldKey] ?? fieldLabel(fieldKey)}</Label>
                      <ProvenanceBadge value={element.data.fieldProvenance[fieldKey] ?? 'human'} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => requestSuggestion(fieldKey)}><Sparkles aria-hidden /> Suggest</Button>
                      <IconButton label={`Delete ${element.data.fieldTitles?.[fieldKey] ?? fieldLabel(fieldKey)} field`} onClick={() => { void deleteField(fieldKey) }}><Trash2 aria-hidden /></IconButton>
                    </div>
                  </div>
                  {element.data.section === 'characters' && fieldKey === 'role' ? (
                    <div className="mt-3 space-y-2">
                      <Select value={ROLE_OPTIONS.includes(fieldDrafts[fieldKey] ?? '') ? fieldDrafts[fieldKey] : '__custom__'} onValueChange={(value) => { if (value !== '__custom__') draftFieldChange(fieldKey, value) }}>
                        <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                          <SelectItem value="__custom__">Custom role</SelectItem>
                        </SelectContent>
                      </Select>
                      {!ROLE_OPTIONS.includes(fieldDrafts[fieldKey] ?? '') && <Input value={fieldDrafts[fieldKey] ?? ''} onChange={(event) => draftFieldChange(fieldKey, event.target.value)} placeholder="Type a custom role" />}
                    </div>
                  ) : element.data.section === 'characters' && fieldKey === 'alignment' ? (
                    <Input value={fieldDrafts[fieldKey] ?? ''} onChange={(event) => draftFieldChange(fieldKey, event.target.value)} placeholder="Moral, political, or personal" className="mt-3 bg-card" />
                  ) : (
                    <Textarea
                      value={fieldDrafts[fieldKey] ?? ''}
                      onChange={(event) => draftFieldChange(fieldKey, event.target.value)}
                      placeholder={`Write ${fieldLabel(fieldKey).toLowerCase()}...`}
                      className="mt-3 min-h-28 bg-card"
                    />
                  )}
                  {pending && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="secondary">AI pending</Badge>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {pending.data.proposedValue}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <IconButton label="Delete suggestion" onClick={() => removeSuggestion(pending.recordId)}>
                            <X aria-hidden />
                          </IconButton>
                          <IconButton label="Accept suggestion" onClick={() => acceptSuggestion(pending)}>
                            <Check aria-hidden />
                          </IconButton>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={revisionText}
                          onChange={(event) => setRevisionText(event.target.value)}
                          placeholder="Enter a revision"
                        />
                        <IconButton
                          label="Revise suggestion"
                          disabled={!revisionText.trim()}
                          onClick={() => reviseSuggestion(pending)}
                        >
                          <RefreshCw aria-hidden />
                        </IconButton>
                        <IconButton
                          label="Revise suggestion"
                          disabled={!revisionText.trim()}
                          onClick={() => reviseSuggestion(pending)}
                        >
                          <Check aria-hidden />
                        </IconButton>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {suggestions.filter((suggestion) => suggestion.data.fieldKey === '__new__' && suggestion.data.status === 'pending').map((suggestion) => (
              <div key={suggestion.recordId} className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium text-foreground">{suggestion.data.proposedTitle || 'New field idea'}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{suggestion.data.proposedValue}</p></div>
                  <div className="flex shrink-0 gap-1"><IconButton label="Dismiss new field idea" onClick={() => removeSuggestion(suggestion.recordId)}><X aria-hidden /></IconButton><IconButton label="Accept new field idea" onClick={() => { void acceptSuggestion(suggestion) }}><Check aria-hidden /></IconButton></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground">Card health</h2>
            <div className="mt-4 space-y-3">
              <Metric label="Version" value={String(element.data.version)} />
              <Metric label="Linked chapters" value={String(chapters.filter((chapter) => chapter.data.linkedElementIds.includes(element.recordId)).length)} />
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground">Context assistant</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The chat dock can read and update these DeepSpace records. Use this card title
              and field names when asking for targeted help.
            </p>
            <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Current context: {project.data.title} / {STAGE_LABELS[element.data.section]} / {element.data.title}
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-foreground">Reference images</h2>
              <Badge variant="outline">{attachments.length}</Badge>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Plus className="size-4" aria-hidden />
              {isUploading ? 'Uploading...' : 'Attach image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploading}
                onChange={uploadReferenceImage}
              />
            </label>
            <div className="mt-4 space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.recordId} className="rounded-lg border border-border bg-background p-2">
                  <img
                    src={getUrl(attachment.data.fileKey)}
                    alt={attachment.data.caption || attachment.data.fileName}
                    className="aspect-video w-full rounded-md object-cover"
                  />
                  <Input
                    value={attachment.data.caption}
                    onChange={(event) => putAttachment(attachment.recordId, { caption: event.target.value })}
                    placeholder="Caption"
                    className="mt-2 h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => removeAttachment(attachment.recordId)}
                  >
                    <Trash2 aria-hidden />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Local uploads work after the first DeepSpace deploy provisions the file gateway token.
            </p>
          </section>
          {suggestions.some((suggestion) => suggestion.data.status === 'replaced') && (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-semibold text-foreground">Inactive suggestions</h2>
              <div className="mt-3 space-y-2">
                {suggestions.filter((suggestion) => suggestion.data.status === 'replaced').map((suggestion) => (
                  <p key={suggestion.recordId} className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground opacity-60">
                    {suggestion.data.proposedValue}
                  </p>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function ChaptersStage({
  project,
  elements,
  chapters,
  references,
}: {
  project: RecordData<Project>
  elements: RecordData<StoryElement>[]
  chapters: RecordData<Chapter>[]
  references: RecordData<Reference>[]
}) {
  const { create, put } = useMutations<Chapter>('chapters')
  const { put: putProject } = useMutations<Project>('projects')
  const canonElements = elements.filter((element) => element.data.canonState === 'Canon')
  const targetPages = project.data.targetPages || 100
  const recommendedChapters = Math.max(1, Math.round(targetPages / 20))
  const [voiceDraft, setVoiceDraft] = useState({ voiceTone: project.data.voiceTone ?? '', pacing: project.data.pacing ?? '', descriptionStyle: project.data.descriptionStyle ?? '', dialogueStyle: project.data.dialogueStyle ?? '', pointOfView: project.data.pointOfView ?? '', styleNotes: project.data.styleNotes ?? '' })

  useEffect(() => {
    setVoiceDraft({ voiceTone: project.data.voiceTone ?? '', pacing: project.data.pacing ?? '', descriptionStyle: project.data.descriptionStyle ?? '', dialogueStyle: project.data.dialogueStyle ?? '', pointOfView: project.data.pointOfView ?? '', styleNotes: project.data.styleNotes ?? '' })
  }, [project.recordId])

  function persistVoice(key: keyof Project, value: string) {
    setVoiceDraft((draft) => ({ ...draft, [key]: value }))
    void put(project.recordId, { [key]: value })
  }

  async function createChapter() {
    const linkedElementIds = canonElements.slice(0, 4).map((element) => element.recordId)
    const dependencyVersions = Object.fromEntries(
      canonElements.slice(0, 4).map((element) => [element.recordId, element.data.version]),
    )
    await create({
      projectId: project.recordId,
      title: `Chapter ${chapters.length + 1}`,
      order: chapters.length + 1,
      objective: '',
      synopsis: '',
      body: '',
      linkedElementIds,
      dependencyVersions,
      consistencyStatus: 'Current',
      lastReviewedAt: new Date().toISOString(),
    })
  }

  function isStale(chapter: RecordData<Chapter>) {
    return chapter.data.linkedElementIds.some((elementId) => {
      const element = elements.find((candidate) => candidate.recordId === elementId)
      return element && chapter.data.dependencyVersions[elementId] !== element.data.version
    })
  }

  return (
    <section>
      <ReferenceFiles projectId={project.recordId} stage="chapters" references={references} />
      <section className="mb-5 rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Draft settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set the scale and audience before drafting. The assistant will use these targets when shaping chapters.</p>
          </div>
          <Badge variant="outline">About {recommendedChapters} chapters</Badge>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Story length">
            <div className="flex items-center justify-between text-sm text-muted-foreground"><span>5 pages</span><strong className="text-foreground">{targetPages} pages</strong><span>1,500 pages</span></div>
            <input type="range" min="5" max="1500" step="5" value={targetPages} onChange={(event) => putProject(project.recordId, { targetPages: Number(event.target.value) })} aria-label="Story length in pages" className="mt-3 w-full accent-primary" />
          </Field>
          <Field label="Reading level">
            <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Elementary</span><strong className="text-foreground">{project.data.readingLevel ?? 'Adult'}</strong><span>Adult</span></div>
            <input type="range" min="0" max={READING_LEVELS.length - 1} step="1" value={Math.max(0, READING_LEVELS.indexOf(project.data.readingLevel ?? 'Adult'))} onChange={(event) => putProject(project.recordId, { readingLevel: READING_LEVELS[Number(event.target.value)] })} aria-label="Reading level" className="mt-3 w-full accent-primary" />
          </Field>
        </div>
      </section>
      <section className="mb-5 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Voice &amp; Tone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Writing settings for the draft itself. These stay editable as the manuscript develops.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Emotional voice"><Input value={voiceDraft.voiceTone} onChange={(event) => persistVoice('voiceTone', event.target.value)} placeholder={VOICE_TONES.join(', ')} /></Field>
          <Field label="Pacing"><Input value={voiceDraft.pacing} onChange={(event) => persistVoice('pacing', event.target.value)} placeholder={PACINGS.join(', ')} /></Field>
          <Field label="Description style"><Input value={voiceDraft.descriptionStyle} onChange={(event) => persistVoice('descriptionStyle', event.target.value)} placeholder={DESCRIPTION_STYLES.join(', ')} /></Field>
          <Field label="Dialogue style"><Input value={voiceDraft.dialogueStyle} onChange={(event) => persistVoice('dialogueStyle', event.target.value)} placeholder={DIALOGUE_STYLES.join(', ')} /></Field>
          <Field label="Point of view"><Input value={voiceDraft.pointOfView} onChange={(event) => persistVoice('pointOfView', event.target.value)} placeholder={POINTS_OF_VIEW.join(', ')} /></Field>
          <Field label="Inspiration notes"><Input value={voiceDraft.styleNotes} onChange={(event) => persistVoice('styleNotes', event.target.value)} placeholder="Short sentences, dry humor, close interiority" /></Field>
        </div>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Chapters</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft chapters from selected canon and flag them when linked elements change.
          </p>
        </div>
        <Button onClick={createChapter}>
          <Plus aria-hidden />
          Add chapter
        </Button>
      </div>

      <div className="mt-5 grid gap-4">
        {chapters.map((chapter) => {
          const stale = isStale(chapter) || chapter.data.consistencyStatus === 'Needs review'
          return (
            <article key={chapter.recordId} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                  value={chapter.data.title}
                  onChange={(event) => put(chapter.recordId, { title: event.target.value })}
                  className="max-w-sm border-transparent px-0 text-base font-semibold shadow-none"
                />
                <Badge variant={stale ? 'warning' : 'success'}>{stale ? 'Needs review' : 'Current'}</Badge>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field label="Objective">
                  <Textarea
                    value={chapter.data.objective}
                    onChange={(event) => put(chapter.recordId, { objective: event.target.value })}
                    className="min-h-24"
                  />
                </Field>
                <Field label="Synopsis">
                  <Textarea
                    value={chapter.data.synopsis}
                    onChange={(event) => put(chapter.recordId, { synopsis: event.target.value })}
                    className="min-h-24"
                  />
                </Field>
              </div>
              <Field label="Draft body" className="mt-4">
                <Textarea
                  value={chapter.data.body}
                  onChange={(event) => put(chapter.recordId, { body: event.target.value })}
                  className="min-h-48"
                />
              </Field>
              <div className="mt-4 flex flex-wrap gap-2">
                {chapter.data.linkedElementIds.map((elementId) => {
                  const element = elements.find((candidate) => candidate.recordId === elementId)
                  if (!element) return null
                  return <Badge key={elementId} variant="outline">{element.data.title}</Badge>
                })}
              </div>
              {stale && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => put(chapter.recordId, {
                    consistencyStatus: 'Current',
                    dependencyVersions: Object.fromEntries(
                      chapter.data.linkedElementIds.map((elementId) => {
                        const element = elements.find((candidate) => candidate.recordId === elementId)
                        return [elementId, element?.data.version ?? 0]
                      }),
                    ),
                    lastReviewedAt: new Date().toISOString(),
                  })}
                >
                  <Check aria-hidden />
                  Mark reviewed
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

const MIN_TIMELINE_DAYS = 1
const MAX_TIMELINE_DAYS = 36000
const TIMELINE_STEPS = 1000

function effectiveTimelineSpan(days: number) {
  return Math.max(MIN_TIMELINE_DAYS, Math.min(MAX_TIMELINE_DAYS, days || MIN_TIMELINE_DAYS))
}

function timelineDaysFromSlider(value: number) {
  return MIN_TIMELINE_DAYS * Math.pow(MAX_TIMELINE_DAYS / MIN_TIMELINE_DAYS, value / TIMELINE_STEPS)
}

function timelineSliderFromDays(days: number) {
  const clampedDays = Math.max(MIN_TIMELINE_DAYS, Math.min(MAX_TIMELINE_DAYS, days || 30))
  return Math.round(Math.log(clampedDays / MIN_TIMELINE_DAYS) / Math.log(MAX_TIMELINE_DAYS / MIN_TIMELINE_DAYS) * TIMELINE_STEPS)
}

function formatTimeline(days: number) {
  if (days < 30) return `${Math.max(1, Math.round(days))} ${Math.round(days) === 1 ? 'day' : 'days'}`
  if (days < 90) {
    const months = Math.max(1, Math.round(days / 30))
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }
  if (days < 36000) {
    const years = Math.max(1, Math.round(days / 360))
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }
  const centuries = Math.max(1, Math.round(days / 36000))
  return `${centuries} ${centuries === 1 ? 'century' : 'centuries'}`
}

function PlotTimeline({ project }: { project: RecordData<Project> }) {
  const { put } = useMutations<Project>('projects')
  const timelineSvgRef = useRef<SVGSVGElement>(null)
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const hasDuration = Boolean(project.data.timelineSpanDays)
  const days = effectiveTimelineSpan(project.data.timelineSpanDays)
  const sliderValue = timelineSliderFromDays(days)
  const progress = sliderValue / TIMELINE_STEPS
  const thumbX = 10 + progress * 580
  const thumbY = 76 - 66 * progress * progress * progress
  const updateTimelineFromPointer = (event: React.PointerEvent<SVGElement>) => {
    const svg = timelineSvgRef.current
    const transform = svg?.getScreenCTM()
    if (!transform) return
    const svgPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse())
    const ratio = Math.max(0, Math.min(1, (svgPoint.x - 10) / 580))
    void put(project.recordId, { timelineSpanDays: timelineDaysFromSlider(ratio * TIMELINE_STEPS) })
  }

  useEffect(() => {
    if (project.data.timelineSpanDays > MAX_TIMELINE_DAYS) void put(project.recordId, { timelineSpanDays: MAX_TIMELINE_DAYS })
  }, [project.data.timelineSpanDays, project.recordId, put])

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="size-4 text-primary" aria-hidden />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Stage 1</p>
          <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        </div>
      </div>
      <p className="mt-3 text-center text-lg font-semibold text-foreground">{hasDuration ? formatTimeline(timelineDaysFromSlider(sliderValue)) : 'Choose duration'}</p>
      <div className="relative mt-2 h-20">
        <svg ref={timelineSvgRef} viewBox="0 0 600 90" role="img" aria-label="Timeline scale rises exponentially from days to centuries" className="absolute inset-0 h-full w-full overflow-visible text-primary" onPointerMove={(event) => { if (isDraggingTimeline) updateTimelineFromPointer(event) }} onPointerUp={(event) => { if (isDraggingTimeline) { setIsDraggingTimeline(false); if (timelineSvgRef.current?.hasPointerCapture(event.pointerId)) timelineSvgRef.current.releasePointerCapture(event.pointerId) } }} onPointerCancel={() => setIsDraggingTimeline(false)}>
          <defs>
            <clipPath id="timeline-progress-clip">
              <rect x="0" y="0" width={thumbX} height="90" />
            </clipPath>
          </defs>
          <path d="M 10 76 C 180 76, 390 70, 590 10 L 590 78 L 10 78 Z" fill="currentColor" fillOpacity="0.08" pointerEvents="none" />
          <path d="M 10 76 C 180 76, 390 70, 590 10 L 590 78 L 10 78 Z" fill="currentColor" fillOpacity="0.75" clipPath="url(#timeline-progress-clip)" pointerEvents="none" />
          <path d="M 10 76 C 180 76, 390 70, 590 10" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" pointerEvents="none" />
          <path d="M 10 76 C 180 76, 390 70, 590 10" fill="none" stroke="currentColor" strokeWidth="3" clipPath="url(#timeline-progress-clip)" pointerEvents="none" />
          <path d="M 10 76 C 180 76, 390 70, 590 10" fill="none" stroke="transparent" strokeWidth="18" strokeLinecap="round" pointerEvents="stroke" className="cursor-pointer" onPointerDown={(event) => { setIsDraggingTimeline(true); timelineSvgRef.current?.setPointerCapture(event.pointerId); updateTimelineFromPointer(event) }} />
          <circle cx={thumbX} cy={thumbY} r="6" fill="currentColor" stroke="hsl(var(--background))" strokeWidth="3" pointerEvents="none" />
        </svg>
        <input
          type="range"
          min={0}
          max={TIMELINE_STEPS}
          step={1}
          value={sliderValue}
          aria-label="Story timeline span"
          onChange={(event) => { void put(project.recordId, { timelineSpanDays: timelineDaysFromSlider(Number(event.target.value)) }) }}
          className="sr-only"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>1 day</span>
        <span>1 century</span>
      </div>
    </section>
  )
}

const TIME_UNITS = [
  { label: 'hours', days: 1 / 24, color: 'bg-amber-500' },
  { label: 'days', days: 1, color: 'bg-sky-500' },
  { label: 'months', days: 30, color: 'bg-emerald-500' },
  { label: 'years', days: 360, color: 'bg-violet-500' },
  { label: 'centuries', days: 36000, color: 'bg-rose-500' },
]
const TIME_UNIT_MULTIPLIERS = [24, 30, 12, 100]
const TIMELINE_EDGE_PADDING_PX = 96
const MIN_TIMELINE_TICK_SPACING_PX = 14

function smallestUnitsPer(unitIndex: number, smallestIndex: number) {
  return TIME_UNIT_MULTIPLIERS.slice(smallestIndex, unitIndex).reduce((total, multiplier) => total * multiplier, 1)
}

function timelineUnit(days: number): { label: string; days: number; index: number } {
  const index = days > 36000 ? 4 : days > 360 ? 3 : days > 30 ? 2 : days > 1 ? 1 : 0
  return { ...TIME_UNITS[index], index }
}

function storyTimelineUnits(days: number) {
  const topUnitIndex = timelineUnit(days).index
  return TIME_UNITS.slice(Math.max(0, topUnitIndex - 2), topUnitIndex + 1).reverse()
}

function timelineParts(days: number, units: typeof TIME_UNITS) {
  let remaining = Math.max(0, days)
  return Object.fromEntries(units.map((unit) => {
    const value = Math.floor(remaining / unit.days)
    remaining -= value * unit.days
    return [unit.label, value]
  })) as Record<string, number>
}

function formatTimelineTimestamp(days: number, units: typeof TIME_UNITS) {
  const parts = timelineParts(days, units)
  const timestamp = units.map((unit) => {
    const value = parts[unit.label]
    if (value === 0) return null
    const label = value === 1 ? (unit.label === 'centuries' ? 'century' : unit.label.slice(0, -1)) : unit.label
    return `${value} ${label}`
  }).filter((part): part is string => Boolean(part)).join(', ')
  return timestamp || `0 ${units.at(-1)?.label ?? 'days'}`
}

function PlotEventTimeline({ project, elements, onOpen, onAddEvent, aiEnabled }: { project: RecordData<Project>; elements: RecordData<StoryElement>[]; onOpen: (id: string) => void; onAddEvent: (days: number, detail?: { title: string; summary: string }) => void; aiEnabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'timeline' | 'events'>('timeline')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0)
  const [timelineViewport, setTimelineViewport] = useState({ left: 0, width: 900 })
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [activeTimelineDays, setActiveTimelineDays] = useState<number | null>(null)
  const [eventCursor, setEventCursor] = useState(0)
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null)
  const [openTimelineIdeaId, setOpenTimelineIdeaId] = useState<string | null>(null)
  const requestedTimelineRanges = useRef(new Set<string>())
  const { records: timelineSuggestions } = useQuery<Suggestion>('suggestions', { where: { projectId: project.recordId }, orderBy: 'createdAt', orderDir: 'desc' })
  const { create: createTimelineSuggestion, remove: removeTimelineSuggestion } = useMutations<Suggestion>('suggestions')
  const readPosition = (element: RecordData<StoryElement>) => {
    const raw = element.data.fields.timelinePosition?.trim() ?? ''
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
  const ordered = useMemo(() => elements.filter((element) => readPosition(element) !== null).sort((a, b) => {
    const aPosition = readPosition(a)
    const bPosition = readPosition(b)
    return (aPosition ?? Number.MAX_SAFE_INTEGER) - (bPosition ?? Number.MAX_SAFE_INTEGER) || a.data.order - b.data.order
  }), [elements])
  const span = effectiveTimelineSpan(project.data.timelineSpanDays)
  const baseUnit = timelineUnit(span)
  const topUnitIndex = baseUnit.index
  const topUnit = TIME_UNITS[topUnitIndex]
  const smallestUnitIndex = Math.max(0, Math.min(topUnitIndex, topUnitIndex - 2 - zoomLevel))
  const visibleUnits = TIME_UNITS.slice(smallestUnitIndex, topUnitIndex + 1).reverse()
  const smallestUnit = TIME_UNITS[smallestUnitIndex]
  const selected = elements.find((element) => element.recordId === selectedId) ?? null
  const totalTopUnits = span / topUnit.days
  const totalSmallestUnits = Math.max(1, Math.round(totalTopUnits * smallestUnitsPer(topUnitIndex, smallestUnitIndex)))
  const measuredTimelineWidthPixels = Math.max(
    720,
    ordered.length * 180,
    900 * Math.pow(1.8, zoomLevel + 1),
    totalSmallestUnits * MIN_TIMELINE_TICK_SPACING_PX,
  )
  const trackWidthPixels = measuredTimelineWidthPixels + TIMELINE_EDGE_PADDING_PX * 2
  const viewportStartDays = Math.max(0, ((timelineViewport.left - TIMELINE_EDGE_PADDING_PX) / measuredTimelineWidthPixels) * span)
  const viewportEndDays = Math.min(span, ((timelineViewport.left + timelineViewport.width - TIMELINE_EDGE_PADDING_PX) / measuredTimelineWidthPixels) * span)
  const pendingTimelineIdeas = timelineSuggestions.filter((suggestion) => suggestion.data.status === 'pending' && suggestion.data.fieldKey === '__timeline__')
  const hoverTrackX = hoverX === null ? null : hoverX + timelineViewport.left
  const hoverDays = hoverTrackX === null || hoverTrackX < TIMELINE_EDGE_PADDING_PX || hoverTrackX > trackWidthPixels - TIMELINE_EDGE_PADDING_PX
    ? null
    : ((hoverTrackX - TIMELINE_EDGE_PADDING_PX) / measuredTimelineWidthPixels) * span
  const hoverTimeLabel = formatTimelineTimestamp(activeTimelineDays ?? 0, visibleUnits)
  const timelineLeft = (days: number) => TIMELINE_EDGE_PADDING_PX + (days / span) * measuredTimelineWidthPixels
  const timelineLeftStyle = (days: number) => `${timelineLeft(days).toFixed(2)}px`
  const activeMarkerX = activeTimelineDays === null ? null : timelineLeft(activeTimelineDays)
  const visibleTickStartPx = Math.max(0, timelineViewport.left - timelineViewport.width)
  const visibleTickEndPx = Math.min(trackWidthPixels, timelineViewport.left + timelineViewport.width * 2)
  const visibleStartCount = Math.max(0, Math.floor((visibleTickStartPx - TIMELINE_EDGE_PADDING_PX) / MIN_TIMELINE_TICK_SPACING_PX))
  const visibleEndCount = Math.min(totalSmallestUnits, Math.ceil((visibleTickEndPx - TIMELINE_EDGE_PADDING_PX) / MIN_TIMELINE_TICK_SPACING_PX))
  const tickByCount = new Map<number, { unit: typeof TIME_UNITS[number]; level: number }>()
  visibleUnits.forEach((timeUnit, level) => {
    const unitIndex = TIME_UNITS.indexOf(timeUnit)
    const boundary = smallestUnitsPer(unitIndex, smallestUnitIndex)
    const firstCount = Math.max(0, Math.ceil(visibleStartCount / boundary) * boundary)
    for (let count = firstCount; count <= visibleEndCount; count += boundary) {
      if (!tickByCount.has(count)) tickByCount.set(count, { unit: timeUnit, level })
    }
  })
  if (visibleStartCount === 0) tickByCount.set(0, { unit: topUnit, level: 0 })
  if (visibleEndCount === totalSmallestUnits) tickByCount.set(totalSmallestUnits, { unit: topUnit, level: 0 })
  const ticks = [...tickByCount.entries()].sort(([a], [b]) => a - b).map(([count, tick]) => ({
    count,
    days: (count / totalSmallestUnits) * span,
    unit: tick.unit,
    level: tick.level,
  }))

  function updateTimelineViewport() {
    const viewport = trackRef.current
    if (!viewport) return
    setTimelineViewport({ left: viewport.scrollLeft, width: viewport.clientWidth || 900 })
  }

  const edgeScrollDirection = hoverX === null ? 0
    : hoverX < timelineViewport.width * 0.05 ? -1
      : hoverX > timelineViewport.width * 0.95 ? 1 : 0

  useEffect(() => {
    if (!aiEnabled || pendingTimelineIdeas.length || viewportEndDays <= viewportStartDays) return
    const rangeKey = `${Math.round(viewportStartDays / smallestUnit.days)}:${Math.round(viewportEndDays / smallestUnit.days)}:${zoomLevel}`
    if (requestedTimelineRanges.current.has(rangeKey)) return
    requestedTimelineRanges.current.add(rangeKey)
    const controller = new AbortController()
    void (async () => {
      try {
        const token = await getAuthToken()
        const response = await fetch('/api/ai/timeline-idea', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          signal: controller.signal,
          body: JSON.stringify({ project: { title: project.data.title, genre: project.data.genre, premise: project.data.premise }, startDays: viewportStartDays, endDays: viewportEndDays }),
        })
        if (!response.ok || controller.signal.aborted) return
        const idea = await response.json() as { title?: string; description?: string; positionDays?: number }
        if (!idea.title || !Number.isFinite(idea.positionDays)) return
        await createTimelineSuggestion({
          projectId: project.recordId,
          elementId: '',
          fieldKey: '__timeline__',
          prompt: 'A concise AI event idea for the visible timeline range.',
          proposedValue: idea.description || '',
          status: 'pending',
          revisionInstruction: '',
          replacesSuggestionId: '',
          suggestionType: 'card',
          targetSection: 'plot',
          proposedFields: { timelinePosition: String(idea.positionDays) },
          proposedTitle: idea.title,
          proposedSummary: idea.description || '',
        })
      } catch {
        // A timeline idea is optional and should never interrupt story work.
      }
    })()
    return () => controller.abort()
  }, [aiEnabled, createTimelineSuggestion, pendingTimelineIdeas.length, project.data.genre, project.data.premise, project.data.title, project.recordId, smallestUnit.days, viewportEndDays, viewportStartDays, zoomLevel])

  useEffect(() => {
    const viewport = trackRef.current
    if (!viewport || viewport.clientWidth === 0) return
    const direction = edgeScrollDirection
    if (!direction) return
    let frame = 0
    const enteredAt = performance.now()
    let previousTime = enteredAt
    let scrollPosition = viewport.scrollLeft
    const scroll = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50) / 1000
      previousTime = time
      const secondsInZone = (time - enteredAt) / 1000
      const speed = Math.min(1800, 60 + 360 * secondsInZone)
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      // Retain fractional movement so slow edge scrolling works on integer scroll offsets.
      scrollPosition = Math.max(0, Math.min(maxScroll, scrollPosition + direction * speed * elapsed))
      viewport.scrollLeft = scrollPosition
      if ((direction < 0 && scrollPosition > 0) || (direction > 0 && scrollPosition < maxScroll)) {
        frame = requestAnimationFrame(scroll)
      }
    }
    const stop = () => cancelAnimationFrame(frame)
    frame = requestAnimationFrame(scroll)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', stop)
    return () => {
      stop()
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', stop)
    }
  }, [edgeScrollDirection, timelineViewport.width, trackWidthPixels])

  useEffect(() => {
    if (!selectedId) return
    const marker = trackRef.current?.querySelector(`[data-event-id="${selectedId}"]`)
    const viewport = trackRef.current
    if (!marker || !viewport) return
    const eventMarker = marker as HTMLElement
    const targetLeft = eventMarker.offsetLeft - (viewport.clientWidth - eventMarker.offsetWidth) / 2
    viewport.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
  }, [selectedId])

  useEffect(() => {
    updateTimelineViewport()
    const viewport = trackRef.current
    if (!viewport) return
    const resizeObserver = new ResizeObserver(updateTimelineViewport)
    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [trackWidthPixels, zoomLevel])

  const positions = ordered.map((element, index) => {
    const raw = readPosition(element)
    const position = raw !== null ? Math.max(0, Math.min(span, raw)) : ordered.length < 2 ? 0 : (index / (ordered.length - 1)) * span
    return { element, position }
  })
  // Leave room for event-count badges above the ruler without clipping them.
  const rulerY = 36
  const nearestDistance = activeTimelineDays === null ? Infinity : Math.min(...positions.map(({ position }) => Math.abs(position - activeTimelineDays)))
  const nearestPosition = activeTimelineDays === null || nearestDistance > smallestUnit.days
    ? null
    : positions.find(({ position }) => Math.abs(position - activeTimelineDays) === nearestDistance) ?? null
  const activeTick = nearestPosition === null ? null : Math.round(nearestPosition.position / smallestUnit.days)
  const nearbyPositions = activeTick === null
    ? []
    : positions.filter(({ position }) => Math.round(position / smallestUnit.days) === activeTick)
  const eventGroupKey = nearbyPositions.map(({ element }) => element.recordId).join(',')
  const focusedNearbyEvent = focusedEventId ? nearbyPositions.find(({ element }) => element.recordId === focusedEventId) : null
  const visibleEvent = focusedNearbyEvent ?? nearbyPositions[eventCursor % Math.max(1, nearbyPositions.length)] ?? null
  const visibleEventLeft = visibleEvent ? timelineLeft(visibleEvent.position) : activeMarkerX
  useEffect(() => {
    setEventCursor(0)
    setFocusedEventId((eventId) => eventId && nearbyPositions.some(({ element }) => element.recordId === eventId) ? eventId : null)
  }, [eventGroupKey])
  const timelineIdea = pendingTimelineIdeas[0] ?? null
  const timelineIdeaPosition = Number(timelineIdea?.data.proposedFields?.timelinePosition)
  const timelineIdeaLeft = timelineIdea && Number.isFinite(timelineIdeaPosition) ? timelineLeft(timelineIdeaPosition) : null
  const eventStubTop = rulerY + 16
  const timelineIdeaTop = rulerY + 6
  const timelineHeight = 120
  const eventStepDays = smallestUnit.days
  const visibleEventIndex = visibleEvent ? positions.findIndex(({ element }) => element.recordId === visibleEvent.element.recordId) : -1

  function acceptTimelineIdea() {
    if (!timelineIdea || !Number.isFinite(timelineIdeaPosition)) return
    onAddEvent(timelineIdeaPosition, { title: timelineIdea.data.proposedTitle || 'Suggested event', summary: timelineIdea.data.proposedSummary || timelineIdea.data.proposedValue })
    void removeTimelineSuggestion(timelineIdea.recordId)
    setOpenTimelineIdeaId(null)
  }

  function moveVisibleEvent(direction: -1 | 1) {
    if (visibleEventIndex < 0 || positions.length < 2) return
    const nextIndex = visibleEventIndex + direction
    if (nextIndex < 0 || nextIndex >= positions.length) return
    const next = positions[nextIndex]
    const viewport = trackRef.current
    if (viewport && visibleEventLeft !== null) {
      const currentViewportX = visibleEventLeft - viewport.scrollLeft
      const nextLeft = timelineLeft(next.position)
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      const nextScrollLeft = Math.max(0, Math.min(maxScroll, nextLeft - currentViewportX))
      viewport.scrollTo({ left: nextScrollLeft, behavior: 'smooth' })
      setTimelineViewport({ left: nextScrollLeft, width: viewport.clientWidth || 900 })
    }
    setActiveTimelineDays(next.position)
    setFocusedEventId(next.element.recordId)
    setHoverX(null)
    setEventCursor(0)
  }

  return (
    <section className="mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <h3 className="col-start-2 text-base font-semibold text-foreground">Event timeline</h3>
        <div className="col-start-3 flex items-center justify-self-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel((level) => Math.max(-1, level - 1))} disabled={zoomLevel <= -1} aria-label="Zoom out timeline" title="Zoom out timeline"><ZoomOut aria-hidden /></Button>
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel((level) => Math.min(Math.max(0, topUnitIndex - 2), level + 1))} disabled={zoomLevel >= Math.max(0, topUnitIndex - 2)} aria-label="Zoom in timeline" title="Zoom in timeline"><ZoomIn aria-hidden /></Button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 border-b border-border">
        <button type="button" onClick={() => setView('timeline')} className={cn('border-b-2 px-2 pb-2 text-sm font-medium', view === 'timeline' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground')}>Timeline</button>
        <button type="button" onClick={() => setView('events')} className={cn('border-b-2 px-2 pb-2 text-sm font-medium', view === 'events' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground')}>Events</button>
      </div>
      {view === 'events' ? <EventOrganizer elements={elements} spanDays={span} selectedId={selectedId} onSelect={setSelectedId} /> : <div ref={trackRef} onScroll={updateTimelineViewport}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          const viewport = event.currentTarget
          const bounds = viewport.getBoundingClientRect()
          const y = event.clientY - bounds.top
          const trackX = event.clientX - bounds.left - viewport.clientLeft
          if (Math.abs(y - rulerY) <= 16) {
            setHoverX(trackX)
            const absoluteX = trackX + viewport.scrollLeft
            setActiveTimelineDays(absoluteX < TIMELINE_EDGE_PADDING_PX || absoluteX > trackWidthPixels - TIMELINE_EDGE_PADDING_PX
              ? null
              : ((absoluteX - TIMELINE_EDGE_PADDING_PX) / measuredTimelineWidthPixels) * span)
          } else {
            setHoverX(null)
          }
        }}
        onPointerLeave={() => setHoverX(null)}
        onPointerCancel={() => { setHoverX(null); setActiveTimelineDays(null) }}
        className="mt-5 w-0 min-w-full max-w-full overflow-x-auto pb-3">
        <div className="relative" style={{ width: `${trackWidthPixels}px`, height: `${timelineHeight}px` }}>
          <div className="absolute h-px bg-border" style={{ top: `${rulerY}px`, left: `${TIMELINE_EDGE_PADDING_PX}px`, width: `${measuredTimelineWidthPixels}px` }} />
          <div className="absolute h-px bg-border" style={{ top: `${rulerY + 5}px`, left: `${TIMELINE_EDGE_PADDING_PX}px`, width: `${measuredTimelineWidthPixels}px` }} />
          {ticks.map((tick, index) => {
            const isEndpoint = tick.count === 0 || tick.count === totalSmallestUnits
            const isCountMarker = isEndpoint || (tick.unit.label === smallestUnit.label && tick.count % 3 === 0)
            const eventCount = isCountMarker
              ? positions.filter(({ position }) => Math.abs(position - tick.days) <= smallestUnit.days).length
              : 0
            return (
              <span key={`${tick.days}-${index}`} className={cn('absolute w-px -translate-y-1/2', tick.unit.color, tick.level === 0 ? 'h-8' : tick.level === 1 ? 'h-5' : 'h-3')} style={{ top: `${rulerY}px`, left: timelineLeftStyle(tick.days) }} aria-hidden>
                {eventCount > 0 && <i className="absolute bottom-full left-1/2 flex h-4 min-w-4 -translate-x-1/2 -translate-y-1 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold not-italic leading-4 text-white">{eventCount}</i>}
              </span>
            )
          })}
          {activeTimelineDays !== null && visibleEventLeft !== null && !visibleEvent && <button type="button" aria-label="Add event at this time" title="Add event at this time" onClick={() => onAddEvent(activeTimelineDays)} className="absolute z-30 flex size-[30px] -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-background text-primary shadow-sm transition-colors hover:border-white hover:bg-accent" style={{ left: `${activeMarkerX?.toFixed(2)}px`, top: `${eventStubTop}px` }}><Plus className="size-4" aria-hidden /></button>}
          {visibleEvent && visibleEventLeft !== null && (
            <>
              <button type="button" aria-label="Add event before this event" title={`Add event ${smallestUnit.label} before`} onClick={() => onAddEvent(Math.max(0, visibleEvent.position - eventStepDays))} className="absolute z-30 flex size-[23px] -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-background text-primary shadow-sm transition-colors hover:border-white hover:bg-accent" style={{ left: `${(visibleEventLeft - 104).toFixed(2)}px`, top: `${eventStubTop + 4}px` }}><Plus className="size-3.5" aria-hidden /></button>
              <button type="button" aria-label="Previous plot event" title="Previous event" onClick={() => moveVisibleEvent(-1)} className="absolute z-30 flex size-7 -translate-x-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" style={{ left: `${(visibleEventLeft - 78).toFixed(2)}px`, top: `${eventStubTop + 2}px` }}><ChevronLeft className="size-4" aria-hidden /></button>
              <button data-event-id={visibleEvent.element.recordId} type="button"
                onPointerEnter={() => { setActiveTimelineDays(visibleEvent.position); setFocusedEventId(visibleEvent.element.recordId) }}
                onClick={() => setSelectedId(visibleEvent.element.recordId)}
                title={visibleEvent.element.data.title}
                className={cn('absolute z-30 h-8 w-36 -translate-x-1/2 rounded-md border border-border/30 bg-background px-2 text-left transition-colors hover:border-primary', selected?.recordId === visibleEvent.element.recordId && 'border-primary ring-2 ring-primary/20')} style={{ left: `${visibleEventLeft.toFixed(2)}px`, top: `${eventStubTop}px` }}>
                <span className="block truncate text-sm font-medium text-foreground">{visibleEvent.element.data.title}</span>
              </button>
              <button type="button" aria-label="Next plot event" title="Next event" onClick={() => moveVisibleEvent(1)} className="absolute z-30 flex size-7 -translate-x-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" style={{ left: `${(visibleEventLeft + 78).toFixed(2)}px`, top: `${eventStubTop + 2}px` }}><ChevronRight className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Add event after this event" title={`Add event ${smallestUnit.label} after`} onClick={() => onAddEvent(Math.min(span, visibleEvent.position + eventStepDays))} className="absolute z-30 flex size-[23px] -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-background text-primary shadow-sm transition-colors hover:border-white hover:bg-accent" style={{ left: `${(visibleEventLeft + 104).toFixed(2)}px`, top: `${eventStubTop + 4}px` }}><Plus className="size-3.5" aria-hidden /></button>
            </>
          )}
          {activeMarkerX !== null && (
            <div aria-hidden className="pointer-events-none absolute z-10 h-8 w-px -translate-y-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.65)]" style={{ top: `${rulerY}px`, left: `${activeMarkerX}px` }} />
          )}
          {timelineIdea && timelineIdeaLeft !== null && <button type="button" aria-label="Review AI event idea" title="Review AI event idea" onClick={() => setOpenTimelineIdeaId(timelineIdea.recordId)} className="absolute z-10 -translate-x-1/2 rounded p-1 text-amber-500 transition-colors hover:bg-amber-500/10" style={{ left: `${timelineIdeaLeft.toFixed(2)}px`, top: `${timelineIdeaTop}px` }}><Lightbulb className="size-5" aria-hidden /></button>}
        </div>
      </div>}
      <div className="flex min-h-7 items-center justify-center text-center text-xs tabular-nums text-foreground" aria-label="Timeline hover time">
        {activeTimelineDays !== null ? hoverTimeLabel : '\u00a0'}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Timeline key">
        {visibleUnits.map((timeUnit, index) => <span key={timeUnit.label} className="inline-flex items-center gap-1.5"><i className={cn(index === 0 ? 'h-4' : index === 1 ? 'h-3' : 'h-2', 'w-0.5', timeUnit.color)} aria-hidden />{timeUnit.label}</span>)}
      </div>
      {timelineIdea && openTimelineIdeaId === timelineIdea.recordId && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">AI event idea</p><h4 className="mt-1 font-semibold text-foreground">{timelineIdea.data.proposedTitle || 'Suggested event'}</h4></div><IconButton label="Close AI event idea" onClick={() => setOpenTimelineIdeaId(null)}><X aria-hidden /></IconButton></div>
          <p className="mt-3 text-sm text-muted-foreground">{timelineIdea.data.proposedSummary || timelineIdea.data.proposedValue}</p>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { void removeTimelineSuggestion(timelineIdea.recordId); setOpenTimelineIdeaId(null) }}><X aria-hidden />Reject</Button><Button size="sm" onClick={acceptTimelineIdea}><Check aria-hidden />Accept event</Button></div>
        </section>
      )}
      {selected ? (
        <button type="button" onClick={() => onOpen(selected.recordId)} className="mt-4 block w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent">
          <p className="text-xs font-medium text-muted-foreground">Selected event</p><h4 className="mt-1 font-semibold text-foreground">{selected.data.title}</h4><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{selected.data.summary || firstFilledField(selected.data) || 'Open this event to add its description.'}</p><p className="mt-3 text-xs font-medium text-primary">Open event card</p>
        </button>
      ) : <p className="mt-4 text-sm text-muted-foreground">Select an event to preview its description, then open it to edit the full card.</p>}
    </section>
  )
}

function EventOrganizer({ elements, spanDays, selectedId, onSelect }: { elements: RecordData<StoryElement>[]; spanDays: number; selectedId: string | null; onSelect: (id: string) => void }) {
  const { put } = useMutations<StoryElement>('elements')
  const ordered = useMemo(() => elements.filter((element) => Number.isFinite(Number(element.data.fields.timelinePosition)) && element.data.fields.timelinePosition.trim() !== '').sort((a, b) => Number(a.data.fields.timelinePosition) - Number(b.data.fields.timelinePosition) || a.data.order - b.data.order), [elements])
  const unordered = useMemo(() => elements.filter((element) => !Number.isFinite(Number(element.data.fields.timelinePosition)) || element.data.fields.timelinePosition.trim() === '').sort((a, b) => a.data.order - b.data.order), [elements])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const span = spanDays
  const eventStep = TIME_UNITS[0].days

  async function moveEvent(targetId: string, destination: 'ordered' | 'unordered') {
    if (!draggedId) return
    const source = elements.find((element) => element.recordId === draggedId)
    const target = elements.find((element) => element.recordId === targetId)
    if (!source || (destination === 'ordered' && !target && ordered.length > 0)) return
    const sourcePosition = Number(source.data.fields.timelinePosition)
    const targetPosition = target ? Number(target.data.fields.timelinePosition) : Number.NaN
    if (destination === 'ordered' && target && Number.isFinite(sourcePosition) && Number.isFinite(targetPosition)) {
      await Promise.all([
        put(source.recordId, { fields: { ...source.data.fields, timelinePosition: String(targetPosition) } }),
        put(target.recordId, { fields: { ...target.data.fields, timelinePosition: String(sourcePosition) } }),
      ])
    } else if (destination === 'unordered') {
      await put(source.recordId, { fields: { ...source.data.fields, timelinePosition: '' }, canonState: 'Sketch' })
    } else if (destination === 'ordered') {
      const latest = ordered.reduce((max, element) => Math.max(max, Number(element.data.fields.timelinePosition)), 0)
      await put(source.recordId, { fields: { ...source.data.fields, timelinePosition: String(Math.min(span, latest + eventStep)) }, canonState: 'Canon' })
    }
    setDraggedId(null)
  }

  function EventStub({ element, destination }: { element: RecordData<StoryElement>; destination: 'ordered' | 'unordered' }) {
    return <button type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', element.recordId); setDraggedId(element.recordId) }} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); void moveEvent(element.recordId, destination) }} onClick={() => onSelect(element.recordId)} className={cn('relative z-10 min-h-16 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary', selectedId === element.recordId && 'border-primary ring-2 ring-primary/20', draggedId === element.recordId && 'opacity-50')}>
      <span className="block truncate text-sm font-medium text-foreground">{element.data.title || 'Untitled event'}</span>
      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{element.data.summary || firstFilledField(element.data) || 'Open to add a description.'}</span>
    </button>
  }

  return <div className="mt-5 max-h-[560px] overflow-y-auto pr-1">
    <section onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void moveEvent(ordered.at(-1)?.recordId ?? '', 'ordered') }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ordered events</p>
      <div className="relative grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-border">
        {ordered.length ? ordered.map((element) => <EventStub key={element.recordId} element={element} destination="ordered" />) : <p className="col-span-full rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">Drag events here to place them on the story timeline.</p>}
      </div>
    </section>
    <div className="my-6 border-t-2 border-dotted border-muted-foreground/60" aria-hidden />
    <section onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void moveEvent(draggedId, 'unordered') }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unordered sketches</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {unordered.length ? unordered.map((element) => <EventStub key={element.recordId} element={element} destination="unordered" />) : <p className="col-span-full rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">Drag an event here when its chronology is still a sketch.</p>}
      </div>
    </section>
  </div>
}

function formatEventTime(days: number, unit: { label: string; days: number }) {
  const value = days / unit.days
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${unit.label}`
}

function TropeSuggestions({
  stage,
  genre,
  hasWrittenContent,
  onUse,
}: {
  stage: ElementSection
  genre: Genre
  hasWrittenContent: boolean
  onUse: (trope: Trope) => void
}) {
  if (hasWrittenContent) return null
  return <TropeRow key={`${stage}-${genre}`} section={stage} candidates={tropesFor(stage, genre)} onUse={onUse} />
}

function OverviewTropes({ genre, onUse }: { genre: Genre; onUse: (trope: OverviewTrope) => void }) {
  return <TropeRow key={genre} section="overview" candidates={OVERVIEW_TROPES.filter((trope) => trope.genres.includes(genre))} onUse={onUse} />
}

function sampleTropes<T extends OverviewTrope>(candidates: T[], previous: T[] = []): T[] {
  const previousNames = new Set(previous.map((trope) => trope.name))
  const pool = [...candidates]
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[pool[index], pool[other]] = [pool[other], pool[index]]
  }
  return [...pool.filter((trope) => !previousNames.has(trope.name)), ...pool.filter((trope) => previousNames.has(trope.name))]
}

const TROPE_CARD_SIZE = 150
const TROPE_CARD_GAP = 12

function TropeRow<T extends OverviewTrope>({ section, candidates, onUse }: { section: TropeSection; candidates: T[]; onUse: (trope: T) => void }) {
  const [batch, setBatch] = useState(() => ({ tropes: sampleTropes(candidates), revision: 0 }))
  const rowRef = useRef<HTMLDivElement>(null)
  const [rowCapacity, setRowCapacity] = useState(1)
  const { enabled, setEnabled } = useSuggestionPreferences()
  const visible = batch.tropes.length > 0 && enabled('tropes') && enabled(section)
  useEffect(() => {
    const row = rowRef.current
    if (!visible || !row) return
    const measure = () => setRowCapacity(Math.max(1, Math.floor((row.clientWidth + TROPE_CARD_GAP) / (TROPE_CARD_SIZE + TROPE_CARD_GAP))))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [visible])
  if (!visible) return null
  return (
    <section className="min-w-0 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-500" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Tropes</h2>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="Refresh tropes" title="Refresh tropes"
            onClick={() => setBatch((previous) => ({ tropes: sampleTropes(candidates, previous.tropes.slice(0, rowCapacity)), revision: previous.revision + 1 }))}>
            <RefreshCw aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Close tropes" title="Close tropes" onClick={() => setEnabled(section, false)}><X aria-hidden /></Button>
        </div>
      </div>
      <div ref={rowRef} className="mt-3 grid min-w-0" style={{ gridTemplateColumns: `repeat(${Math.min(rowCapacity, batch.tropes.length)}, minmax(0, ${TROPE_CARD_SIZE}px))`, gap: TROPE_CARD_GAP }}>
        {batch.tropes.slice(0, rowCapacity).map((trope, index) => (
          <button key={`${batch.revision}-${trope.name}`} type="button" onClick={() => { void onUse(trope) }}
            style={{ animationDelay: `${index * 120}ms` }}
            className="trope-fade-in aspect-square min-w-0 overflow-y-auto rounded-md border border-border bg-background p-2 text-left align-top transition-colors hover:bg-accent">
            <span className="block break-words text-xs font-medium leading-4 text-foreground">{trope.name}</span>
            <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">{trope.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ReferenceFiles({
  projectId,
  stage,
  references,
}: {
  projectId: string
  stage: Stage
  references: RecordData<Reference>[]
}) {
  const { upload, readFile, deleteFile, isUploading } = useR2Files()
  const { create, remove, ready } = useMutations<Reference>('references')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const { success, error } = useToast()
  const [preview, setPreview] = useState<RecordData<Reference> | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [removeTarget, setRemoveTarget] = useState<RecordData<Reference> | null>(null)
  const stageReferences = references.filter((reference) => reference.data.stage === stage)

  async function uploadReference(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length || uploadProgress || !ready) return
    let added = 0
    const failures: string[] = []
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress({ current: index + 1, total: files.length })
        const isText = file.type === 'text/plain' || file.type === 'text/markdown' || /\.(txt|md)$/i.test(file.name)
        if (!isText || file.size > 2_000_000) {
          failures.push(`${file.name}: ${!isText ? 'use .txt or .md' : 'exceeds 2 MB'}`)
          continue
        }
        try {
          const result = await upload(file, file.name)
          if (!result.success || !result.key) throw new Error(result.error || 'Upload failed')
          await create({
            projectId,
            stage,
            fileKey: result.key,
            fileName: file.name,
            mimeType: file.type || (file.name.toLowerCase().endsWith('.md') ? 'text/markdown' : 'text/plain'),
            size: file.size,
            status: 'ready',
          })
          added++
        } catch {
          failures.push(`${file.name}: could not be added`)
        }
      }
    } finally {
      setUploadProgress(null)
    }
    if (added) success('References added', `${added} ${added === 1 ? 'file is' : 'files are'} ready to preview.`)
    if (failures.length) error('Some files were not added', failures.join('\n'))
  }

  async function openPreview(reference: RecordData<Reference>) {
    setPreview(reference)
    setPreviewText('')
    setPreviewState('loading')
    try {
      const response = await readFile(reference.data.fileKey)
      if (!response.ok) throw new Error('The file could not be read.')
      setPreviewText(await response.text())
      setPreviewState('idle')
    } catch {
      setPreviewState('error')
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return
    const result = await deleteFile(removeTarget.data.fileKey)
    if (!result.success) {
      error('Could not remove file', result.error || 'The stored file could not be deleted.')
      return
    }
    await remove(removeTarget.recordId)
    success('Reference removed')
    setRemoveTarget(null)
    if (preview?.recordId === removeTarget.recordId) setPreview(null)
  }

  return (
    <>
      <section className="rounded-lg border border-dashed border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Paperclip className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Reference files</h2>
            <Badge variant="outline">{stageReferences.length}</Badge>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            <Paperclip className="size-4" aria-hidden />
            {uploadProgress ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` : 'Add'}
            <input type="file" multiple accept=".txt,.md,text/plain,text/markdown" className="sr-only" disabled={!ready || isUploading || Boolean(uploadProgress)} onChange={uploadReference} />
          </label>
        </div>
        {stageReferences.length > 0 && (
          <div className="mt-4 divide-y divide-border rounded-md border border-border bg-background">
            {stageReferences.map((reference) => (
              <div key={reference.recordId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{reference.data.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(reference.data.size)} · {reference.data.status === 'ready' ? 'Ready' : reference.data.status}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => { void openPreview(reference) }}>Open preview</Button>
                  <IconButton label={`Remove ${reference.data.fileName}`} onClick={() => setRemoveTarget(reference)}><Trash2 aria-hidden /></IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} size="lg">
        <Modal.Header>
          <Modal.Title>{preview?.data.fileName || 'Reference preview'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewState === 'loading' && <p className="text-sm text-muted-foreground">Reading file...</p>}
          {previewState === 'error' && <p className="text-sm text-destructive">This reference could not be read.</p>}
          {previewState === 'idle' && <pre className="max-h-[60vh] whitespace-pre-wrap break-words rounded-md bg-muted/40 p-4 font-mono text-sm leading-6 text-foreground">{previewText}</pre>}
        </Modal.Body>
        <Modal.Footer><Button variant="outline" onClick={() => setPreview(null)}>Close</Button></Modal.Footer>
      </Modal>

      <ConfirmModal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => { void confirmRemove() }}
        title={`Remove ${removeTarget?.data.fileName || 'reference'}?`}
        description="This removes the reference from the story and deletes its private stored file."
        confirmText="Remove file"
      />
    </>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ProgressLine({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block space-y-2', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function ProvenanceBadge({ value }: { value: string }) {
  const label = value === 'ai_accepted'
    ? 'AI accepted'
    : value === 'human_edited_ai'
      ? 'Human edited AI'
      : value === 'ai_pending'
        ? 'AI pending'
        : 'Human'
  return <Badge variant={value.startsWith('ai') ? 'secondary' : 'info'}>{label}</Badge>
}

function fieldLabel(fieldKey: string) {
  return FIELD_LABELS[fieldKey] ?? fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase())
}

function firstFilledField(element: StoryElement) {
  return Object.values(element.fields).find((value) => value.trim()) ?? ''
}

function nextStageAfterCompletion(stage: Stage, completedStages: Stage[]): Stage {
  if (stage === 'overview') return 'world'
  if (stage === 'world') return 'characters'
  if (stage === 'characters') return completedStages.includes('plot') ? 'chapters' : 'plot'
  if (stage === 'plot') return completedStages.includes('characters') ? 'chapters' : 'characters'
  return 'chapters'
}

async function createStoryIdea(
  project: RecordData<Project>,
  element: RecordData<StoryElement>,
  createSuggestion: (data: Omit<Suggestion, 'projectId'> & { projectId: string }) => Promise<string>,
  preferNewField = false,
  signal?: AbortSignal,
) {
  const token = await getAuthToken()
  const response = await fetch('/api/ai/story-idea', {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      project: { title: project.data.title, genre: project.data.genre, premise: project.data.premise },
      element: { title: element.data.title, type: element.data.type, summary: element.data.summary, fields: element.data.fields },
      preferNewField,
    }),
  })
  if (!response.ok) return
  const data = await response.json() as { fieldKey?: string; suggestion?: string; suggestionType?: 'field' | 'card'; proposedTitle?: string; proposedSummary?: string }
  if (signal?.aborted) return
  if (!data.fieldKey || !data.suggestion) return
  await createSuggestion({
    projectId: project.recordId,
    elementId: element.recordId,
    fieldKey: data.fieldKey,
    prompt: 'One concise story-building idea generated for this incomplete card.',
    proposedValue: data.suggestion,
    status: 'pending',
    revisionInstruction: '',
    replacesSuggestionId: '',
    suggestionType: data.suggestionType ?? 'field',
    targetSection: element.data.section,
    proposedTitle: data.proposedTitle,
    proposedSummary: data.proposedSummary,
  })
}
