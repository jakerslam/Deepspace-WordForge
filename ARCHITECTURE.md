# Word Forge Architecture

**Status:** V1 implementation direction  
**Platform:** DeepSpace SDK  
**Primary language:** TypeScript

## Stack

Word Forge uses the standard DeepSpace scaffold:

- **Frontend:** React, Vite, TypeScript, Tailwind v4, shadcn-style primitives.
- **Worker:** Hono on Cloudflare Workers through the DeepSpace scaffold.
- **Persistence:** DeepSpace records backed by SQLite inside Durable Objects.
- **Realtime:** DeepSpace record subscriptions over WebSocket.
- **AI:** DeepSpace worker AI helpers and server actions for contextual suggestions and chapter drafting.
- **Files:** DeepSpace private R2 storage for reference images attached to story elements and stage-level `.txt`/`.md` research references.
- **Auth and permissions:** DeepSpace authentication with owner-scoped records for private projects.

## V1 DeepSpace Integrations

Word Forge will use at least these DeepSpace primitives in product-critical flows:

1. **Auth and permissions:** Writers sign in before seeing projects. Project, element, suggestion, chapter, and attachment records are owner-private.
2. **Realtime records:** Project state, structured story elements, AI suggestions, chapters, and dependency metadata live in DeepSpace collections and update live across tabs/sessions.
3. **AI server actions:** The contextual assistant creates reviewable field suggestions and chapter drafts using only the selected project, stage, and element context.
4. **File storage:** Images upload through DeepSpace files and are linked back to elements as attachment records. Text references use the same private file API with stage-scoped metadata records and read-only previews.

Presence/cursors are a good stretch integration after the core path works, especially for showing "editing now" state on an open element.

## Record Model

V1 favors a small number of flexible collections so we can ship a finished project within the remaining deadline.

### `projects`

One story workspace.

- `title`
- `premise`
- `genre`
- `tone`
- `timelineSpanDays`
- `completedStages`
- `unlockedStages`
- `stageAttention`
- `overallCoverage`

### `elements`

World items, characters, and plot points.

- `projectId`
- `section`
- `type`
- `title`
- `summary`
- `canonState`
- `fields`
- `fieldProvenance`
- `relationships`
- `coverage`
- `version`
- `order`

### `suggestions`

AI proposals that require user review.

- `projectId`
- `elementId`
- `fieldKey`
- `prompt`
- `proposedValue`
- `status`
- `revisionInstruction`
- `replacesSuggestionId`

### `chapters`

Plain-text chapter drafts and their canon dependencies.

- `projectId`
- `title`
- `order`
- `objective`
- `synopsis`
- `body`
- `linkedElementIds`
- `dependencyVersions`
- `consistencyStatus`
- `lastReviewedAt`

### `attachments`

Reference images linked to story elements.

- `projectId`
- `elementId`
- `fileKey`
- `fileName`
- `mimeType`
- `caption`

### `references`

Stage-scoped text references stored privately in R2 and previewed without editing.

- `projectId`
- `stage`
- `fileKey`
- `fileName`
- `mimeType`
- `size`
- `status`

### `tropes`

Shared genre-aware trope records can create Sketch cards and pending follow-up card suggestions in later stages.

- `section`
- `name`
- `description`
- `genres`
- `followUps`

### `tropes`

Shared section- and genre-aware trope records used as starter prompts until a writer begins filling a section.

- `section`
- `name`
- `description`
- `genres`

## UI Architecture

The first implementation keeps the UI focused:

- `ProjectDashboard` handles project creation and selection.
- `Workspace` owns the active project, tab gating, and shared queries.
- `StageTabs` displays Overview, World, Characters, Plot, and Chapters with locked states.
- `ElementGrid` renders compact cards for World, Characters, and Plot.
- `ElementEditor` opens a focused editor where users can type directly and autosave.
- `ReferenceFiles` handles stage uploads, read-only previews, and confirmed removal.
- `SuggestionReview` handles accept, delete, revise, and inactive replacement states.
- `AssistantDock` sends scoped context to worker actions.
- `ChaptersView` creates drafts, links dependencies, and shows stale-canon warnings.

## Server Architecture

The Hono worker exposes app routes from the DeepSpace scaffold and server actions for privileged or AI-backed work:

- `createProjectFromTemplate`
- `requestElementSuggestion`
- `reviseSuggestion`
- `acceptSuggestion`
- `generateChapterDraft`
- `markChapterReviewed`

These actions protect invariants that should not be left to client-only code, such as provenance transitions, element version bumps, stage completion, and chapter dependency checks.

## Implementation Order

1. Scaffold the DeepSpace app in place.
2. Add collection schemas and shared TypeScript types.
3. Build a static-but-wired React shell using DeepSpace record queries/mutations.
4. Implement project creation, stage gates, template seeding, and element editing.
5. Add suggestion review with deterministic placeholder worker actions first.
6. Add AI-backed assistant and chapter generation once the local record flow is stable.
7. Add file uploads for reference images.
8. Verify local dev, important path, and prepare deployment/writeup.

## Key Tradeoff

V1 stores structured element fields as JSON instead of separate per-field records. That keeps the app shippable and makes template variation easy. The cost is less granular collaboration; if we later need true field-level multiplayer editing, we can split fields into their own collection or use DeepSpace collaborative editing primitives for long-form fields.
