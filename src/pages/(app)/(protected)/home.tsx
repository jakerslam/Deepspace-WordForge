import { useEffect, useMemo, useRef, useState } from 'react'
import type { RecordData } from 'deepspace'
import { useLocation } from 'react-router-dom'
import { getAuthToken, useMutations, useQuery, useR2Files } from 'deepspace'
import {
  ArrowLeft,
  Check,
  ChevronDown,
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
        'mb-4 flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors',
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
      <section>
        <PhaseHeader
          title="Stage 1: Overview"
          description={overviewPhaseOneCollapsed ? 'Completed stage collapsed.' : undefined}
          collapsible={overviewReady}
          collapsed={overviewPhaseOneCollapsed}
          onToggle={() => setOverviewPhaseOneCollapsed((collapsed) => !collapsed)}
        />
        {!overviewPhaseOneCollapsed && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This is the anchor the rest of the workspace builds from. Keep it short enough
              that the assistant can use it as context without drowning out the selected card.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
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
      <section className={cn('transition-opacity duration-300', !overviewReady && 'pointer-events-none opacity-0')}>
        <PhaseHeader
          title="Stage 2: Lessons & morals"
          collapsible={false}
          collapsed={false}
          onToggle={() => {}}
        />
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Lessons & morals</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add the story's intended meaning once its central description is in place.</p>
          <div className="mt-4">
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
    if (!setupReady) return
    if (stageSuggestions.some((suggestion) => suggestion.data.suggestionType === 'card' && suggestion.data.status === 'pending')) return
    const candidate = elements.find((item) => {
      if (elementCoverage(item.data) === 100 || requestedIdeaIds.current.has(item.recordId)) return false
      return !stageSuggestions.some((suggestion) => suggestion.data.elementId === item.recordId && suggestion.data.status === 'pending')
    })
    if (!candidate) return
    requestedIdeaIds.current.add(candidate.recordId)
    const hasAcceptedIdea = stageSuggestions.some((suggestion) => suggestion.data.elementId === candidate.recordId && suggestion.data.status === 'accepted')
    void createStoryIdea(project, candidate, createSuggestion, hasAcceptedIdea).finally(() => requestedIdeaIds.current.delete(candidate.recordId))
  }, [createSuggestion, elements, project, setupReady, stageSuggestions])

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
        <section>
          <PhaseHeader
            title="Stage 1: Timespan"
            description={timelineCollapsed ? 'Completed stage collapsed.' : undefined}
            collapsible={setupReady}
            collapsed={timelineCollapsed}
            onToggle={() => setTimelineCollapsed((collapsed) => !collapsed)}
          />
          {!timelineCollapsed && <PlotTimeline project={project} />}
        </section>
      )}
      <section className={cn('transition-opacity duration-300', stage === 'plot' && !setupReady && 'pointer-events-none opacity-0')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

        {stage === 'plot' ? <PlotEventTimeline project={project} elements={elements} onOpen={onOpen} /> : <div className={cn('mt-5 grid gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3', !setupReady && 'pointer-events-none opacity-0')}>
          {cardIdeas.map((idea) => (
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
                  {idea && <div className="relative">
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
  const [newFieldTitle, setNewFieldTitle] = useState('')
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const plotSpan = effectiveTimelineSpan(project.data.timelineSpanDays)
  const plotUnit = timelineUnit(plotSpan)
  const eventPosition = Number(fieldDrafts.timelinePosition || '')
  const eventDays = Number.isFinite(eventPosition) ? Math.max(0, Math.min(plotSpan, eventPosition)) : 0

  useEffect(() => {
    setTitleDraft(element.data.title)
    setSummaryDraft(element.data.summary)
    setFieldDrafts(element.data.fields)
  }, [element.recordId])

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
        <Button variant="ghost" onClick={onBack}>
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
              <div className="flex items-center justify-between gap-3"><Label>Timeline placement</Label><span className="text-xs text-muted-foreground">{formatEventTime(eventDays, plotUnit)} into the {formatTimeline(plotSpan)} span</span></div>
              <input type="range" min="0" max="1000" step="1" value={Math.round((eventDays / plotSpan) * 1000)} onChange={(event) => draftFieldChange('timelinePosition', String((Number(event.target.value) / 1000) * plotSpan))} aria-label="Place event on story timeline" className="mt-3 w-full accent-primary" />
              <div className="mt-3 flex items-center gap-2"><Input type="number" min="0" step="0.1" value={eventDays ? String(Math.round((eventDays / plotUnit.days) * 10) / 10) : ''} onChange={(event) => { const value = Number(event.target.value); draftFieldChange('timelinePosition', Number.isFinite(value) ? String(Math.max(0, Math.min(plotSpan / plotUnit.days, value)) * plotUnit.days) : '') }} placeholder="0" aria-label={`Event time in ${plotUnit.label}`} /><span className="text-sm text-muted-foreground">{plotUnit.label}</span></div>
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

function PlotEventTimeline({ project, elements, onOpen }: { project: RecordData<Project>; elements: RecordData<StoryElement>[]; onOpen: (id: string) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0)
  const [timelineViewport, setTimelineViewport] = useState({ left: 0, width: 900 })
  const [hoverX, setHoverX] = useState<number | null>(null)
  const readPosition = (element: RecordData<StoryElement>) => {
    const raw = element.data.fields.timelinePosition?.trim() ?? ''
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
  const ordered = useMemo(() => [...elements].sort((a, b) => {
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
  const selected = ordered.find((element) => element.recordId === selectedId) ?? null
  const totalTopUnits = span / topUnit.days
  const totalSmallestUnits = Math.max(1, Math.round(totalTopUnits * smallestUnitsPer(topUnitIndex, smallestUnitIndex)))
  const measuredTimelineWidthPixels = Math.max(
    720,
    ordered.length * 180,
    900 * Math.pow(1.8, zoomLevel + 1),
    totalSmallestUnits * MIN_TIMELINE_TICK_SPACING_PX,
  )
  const trackWidthPixels = measuredTimelineWidthPixels + TIMELINE_EDGE_PADDING_PX * 2
  const hoverTrackX = hoverX === null ? null : hoverX + timelineViewport.left
  const hoverDays = hoverTrackX === null || hoverTrackX < TIMELINE_EDGE_PADDING_PX || hoverTrackX > trackWidthPixels - TIMELINE_EDGE_PADDING_PX
    ? null
    : ((hoverTrackX - TIMELINE_EDGE_PADDING_PX) / measuredTimelineWidthPixels) * span
  let remainingHoverUnits = hoverDays === null ? 0 : Math.min(Math.round(hoverDays / smallestUnit.days), Math.floor(span / smallestUnit.days))
  const hoverTimeLabel = visibleUnits.map((unit) => {
    const unitsPerMeasure = smallestUnitsPer(TIME_UNITS.indexOf(unit), smallestUnitIndex)
    const count = Math.floor(remainingHoverUnits / unitsPerMeasure)
    remainingHoverUnits %= unitsPerMeasure
    const label = count === 1 ? (unit.label === 'centuries' ? 'century' : unit.label.slice(0, -1)) : unit.label
    return `${count} ${label}`
  }).join(', ')
  const timelineLeft = (days: number) => TIMELINE_EDGE_PADDING_PX + (days / span) * measuredTimelineWidthPixels
  const timelineLeftStyle = (days: number) => `${timelineLeft(days).toFixed(2)}px`
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
    const samePositionIndex = ordered.slice(0, index).filter((candidate) => {
      const candidatePosition = readPosition(candidate)
      return candidatePosition !== null && Math.abs(candidatePosition - position) < 0.01
    }).length
    return { element, position, samePositionIndex }
  })

  return (
    <section className="mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Stage 2</p><h3 className="mt-1 text-base font-semibold text-foreground">Event timeline</h3><p className="mt-1 text-sm text-muted-foreground">Place events along the story span to keep cause, consequence, and continuity visible.</p></div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel((level) => Math.max(-1, level - 1))} disabled={zoomLevel <= -1} aria-label="Zoom out timeline" title="Zoom out timeline"><ZoomOut aria-hidden /></Button>
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel((level) => Math.min(Math.max(0, topUnitIndex - 2), level + 1))} disabled={zoomLevel >= Math.max(0, topUnitIndex - 2)} aria-label="Zoom in timeline" title="Zoom in timeline"><ZoomIn aria-hidden /></Button>
        </div>
      </div>
      <div ref={trackRef} onScroll={updateTimelineViewport}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          const viewport = event.currentTarget
          setHoverX(event.clientX - viewport.getBoundingClientRect().left - viewport.clientLeft)
        }}
        onPointerLeave={() => setHoverX(null)}
        onPointerCancel={() => setHoverX(null)}
        className="mt-5 w-0 min-w-full max-w-full overflow-x-auto pb-3">
        <div className="relative h-56" style={{ width: `${trackWidthPixels}px` }}>
          <div className="absolute top-1/2 h-px bg-border" style={{ left: `${TIMELINE_EDGE_PADDING_PX}px`, width: `${measuredTimelineWidthPixels}px` }} />
          <div className="absolute top-[calc(50%+5px)] h-px bg-border" style={{ left: `${TIMELINE_EDGE_PADDING_PX}px`, width: `${measuredTimelineWidthPixels}px` }} />
          {ticks.map((tick, index) => {
            return <span key={`${tick.days}-${index}`} className={cn('absolute top-1/2 w-px -translate-y-1/2', tick.unit.color, tick.level === 0 ? 'h-8' : tick.level === 1 ? 'h-5' : 'h-3')} style={{ left: timelineLeftStyle(tick.days) }} aria-hidden />
          })}
          {positions.map(({ element, position, samePositionIndex }, index) => {
            const left = span ? timelineLeft(position) : TIMELINE_EDGE_PADDING_PX + (index / Math.max(1, positions.length - 1)) * measuredTimelineWidthPixels
            const above = index % 2 === 0
            return (
              <button key={element.recordId} data-event-id={element.recordId} type="button" onClick={() => setSelectedId(element.recordId)} className={cn('absolute w-36 -translate-x-1/2 rounded-md border bg-background p-2 text-left shadow-sm transition-colors hover:border-primary', selected?.recordId === element.recordId && 'border-primary ring-2 ring-primary/20')} style={{ left: `${left.toFixed(2)}px`, top: above ? `${30 - samePositionIndex * 48}px` : `${120 + samePositionIndex * 48}px` }}>
                <span className="block truncate text-sm font-medium text-foreground">{element.data.title}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{formatEventTime(position, topUnit)}</span>
              </button>
            )
          })}
          {hoverDays !== null && hoverTrackX !== null && (
            <div aria-hidden className="pointer-events-none absolute top-1/2 z-10 h-8 w-px -translate-y-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.65)]" style={{ left: `${hoverTrackX}px` }} />
          )}
        </div>
      </div>
      <div className="flex min-h-7 items-center justify-center text-center text-xs tabular-nums text-foreground" aria-label="Timeline hover time">
        {hoverDays !== null ? hoverTimeLabel : '\u00a0'}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Timeline key">
        {visibleUnits.map((timeUnit, index) => <span key={timeUnit.label} className="inline-flex items-center gap-1.5"><i className={cn(index === 0 ? 'h-4' : index === 1 ? 'h-3' : 'h-2', 'w-0.5', timeUnit.color)} aria-hidden />{timeUnit.label}</span>)}
      </div>
      {selected ? (
        <button type="button" onClick={() => onOpen(selected.recordId)} className="mt-4 block w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent">
          <p className="text-xs font-medium text-muted-foreground">Selected event</p><h4 className="mt-1 font-semibold text-foreground">{selected.data.title}</h4><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{selected.data.summary || firstFilledField(selected.data) || 'Open this event to add its description.'}</p><p className="mt-3 text-xs font-medium text-primary">Open event card</p>
        </button>
      ) : <p className="mt-4 text-sm text-muted-foreground">Select an event to preview its description, then open it to edit the full card.</p>}
    </section>
  )
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
  const tropes = useMemo(() => {
    const candidates = tropesFor(stage, genre)
    return [...candidates].sort(() => Math.random() - 0.5).slice(0, 3)
  }, [genre, stage])
  if (hasWrittenContent || tropes.length === 0) return null

  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-500" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Tropes</h2>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {tropes.map((trope) => (
          <button key={trope.name} type="button" onClick={() => { void onUse(trope) }} className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-accent">
            <p className="text-sm font-medium text-foreground">{trope.name}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{trope.description}</p>
            <p className="mt-2 text-xs font-medium text-primary">Create Sketch card</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function OverviewTropes({ genre, onUse }: { genre: Genre; onUse: (trope: OverviewTrope) => void }) {
  const tropes = OVERVIEW_TROPES.filter((trope) => trope.genres.includes(genre))
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-500" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Tropes</h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tropes.map((trope) => (
          <button key={trope.name} type="button" onClick={() => { void onUse(trope) }} className="rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent">
            <span className="block text-sm font-medium text-foreground">{trope.name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{trope.description}</span>
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
  const { create, remove } = useMutations<Reference>('references')
  const { success, error } = useToast()
  const [preview, setPreview] = useState<RecordData<Reference> | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [removeTarget, setRemoveTarget] = useState<RecordData<Reference> | null>(null)
  const stageReferences = references.filter((reference) => reference.data.stage === stage)

  async function uploadReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const isText = file.type === 'text/plain' || file.type === 'text/markdown' || /\.(txt|md)$/i.test(file.name)
    if (!isText) {
      error('Unsupported reference file', 'Upload a .txt or .md file so Word Forge can preview it.')
      return
    }
    if (file.size > 2_000_000) {
      error('Reference file is too large', 'Keep text references under 2 MB for a fast preview.')
      return
    }

    const result = await upload(file, file.name)
    if (!result.success || !result.key) {
      error('Upload failed', result.error || 'The file could not be stored.')
      return
    }
    await create({
      projectId,
      stage,
      fileKey: result.key,
      fileName: file.name,
      mimeType: file.type || (file.name.toLowerCase().endsWith('.md') ? 'text/markdown' : 'text/plain'),
      size: file.size,
      status: 'ready',
    })
    success('Reference added', `${file.name} is ready to preview.`)
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
            {isUploading ? 'Uploading...' : 'Add'}
            <input type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" disabled={isUploading} onChange={uploadReference} />
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
) {
  const token = await getAuthToken()
  const response = await fetch('/api/ai/story-idea', {
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
