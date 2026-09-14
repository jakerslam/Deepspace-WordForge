# Word Forge

Word Forge is a canon-aware prewriting workspace for fiction. Writers construct the world, characters, and plot before generating prose, explicitly approve AI suggestions, and receive warnings when changed canon may make a chapter inconsistent.

The project is built as a full-stack DeepSpace application for the DeepSpace software engineering internship exercise.

Live DeepSpace app: [https://wordforge-jakerslam.app.space](https://wordforge-jakerslam.app.space)

Static GitHub Pages preview: [https://jakerslam.github.io/Deepspace-WordForge/](https://jakerslam.github.io/Deepspace-WordForge/)

The GitHub Pages build is a static preview. Authentication, realtime records, AI routes, and private file storage require the DeepSpace deployment above.

## Product Status

Word Forge is scaffolded as a DeepSpace app and the first vertical slice is implemented. The implementation scope is defined in [SRS.md](./SRS.md), the technical direction is captured in [ARCHITECTURE.md](./ARCHITECTURE.md), and the core product states are represented in the Figma file below.

## Product Design

- [Word Forge V1 Figma](https://www.figma.com/design/QFjoWI3nVgzjkJgS8OFNAx)
- [Gated World workspace source](./docs/design/world-workspace.svg)
- [Direct element editor source](./docs/design/element-editor.svg)
- [AI suggestion review source](./docs/design/element-review.svg)
- [Chapter consistency source](./docs/design/chapters-consistency.svg)

The design covers the gated World workspace, direct card editing, AI suggestion review, and chapter consistency review. Human-authored content uses blue provenance labels, AI-originated content uses neutral gray labels, and canon-impact warnings use amber. Labels accompany color so provenance and status do not depend on color alone. Cards use neutral borders rather than provenance-colored edge treatments.

## V1 Workflow

1. Create a story project and complete its Overview.
2. Build and complete the World, which unlocks Characters and Plot together.
3. Open any card and type directly into its structured fields.
4. Optionally ask the contextual assistant for help with a selected field.
5. Accept, reject, or revise an AI suggestion before it becomes canon.
6. Complete Plot with at least one plot point to unlock Chapters.
7. Generate a chapter from explicitly selected canon elements.
8. Review the chapter when a linked element changes.

## Why It Is Different

Word Forge is not a one-prompt story generator. Its core is a controlled canon pipeline:

`Sketch or human input -> AI suggestion -> writer approval -> canon -> chapter dependency -> consistency review`

AI can propose material, but it cannot silently overwrite the writer's story. Chapters retain links to the elements used to create them so later canon changes remain visible.

## DeepSpace Integrations

- **Authentication and permissions:** Private story projects owned by authenticated writers.
- **Realtime records:** Projects, elements, suggestions, chapters, reference metadata, and attachment metadata.
- **AI chat and tools:** A contextual assistant and focused generation routes that read selected story context and create reviewable suggestions.
- **File storage:** Private R2 storage for card images plus stage-level `.txt` and `.md` references with read-only previews.

Optional co-author collaboration may be added after the core path is complete.

## Submission Scope

The submission targets five workspace tabs: Overview, World, Characters, Plot, and Chapters. It includes gated stage progression with progressive disclosure inside each stage, genre starter templates, direct structured element editing, Canon and Sketch states, provenance, AI suggestion review, story completion, timeline and event ordering views, writing voice settings, and stale-chapter warnings.

The map editor, visual relationship graph, custom card groups, rich-text collaboration, image generation, and indexed knowledge search are intentionally deferred.

## Development

The application uses the standard DeepSpace React, Vite, Hono, and Cloudflare Worker scaffold.

Use Node 22.15+ and npm 11.6+:

```bash
npm install
npx deepspace auth login
npx deepspace app init
npx deepspace dev start
```

Deployment will use:

```bash
npx deepspace deploy
```

Secrets must be managed through DeepSpace and must never be committed to the repository.

## Documentation

- [Software Requirements Specification](./SRS.md)
- [Architecture](./ARCHITECTURE.md)
- [DeepSpace documentation](https://docs.deep.space/)
