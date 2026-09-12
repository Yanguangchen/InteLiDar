# Contributing

Changes to InteLiDar follow **test-driven development**. That is a project rule, not a suggestion.

Read [README.md](./README.md) for product context, [design.md](./design.md) for the engineering map, and [docs/development.md](./docs/development.md) for commands and seams.

## Before you write production code

1. Pick a seam (ask, ingest, reconstruct, HTTP, `moveObject`, …).
2. Add a test that fails for the behaviour you want.
3. Run only that test and confirm the failure is the assertion you meant.
4. Implement the minimum to pass.
5. Run `npm test` (Vitest, pytest, and Playwright). First machine: `npx playwright install chromium`.

If the feature is visual-only (spacing, fog colour), say so in the PR and still avoid drive-by refactors. Prefer extracting a named rule and testing that.

## Local loop

```bash
npm run backend    # terminal 1
npm run dev        # terminal 2
npm test           # before you push
```

Setup: [docs/getting-started.md](./docs/getting-started.md).

## Scope

- Keep capture, vision, graph, reasoner, and viewer separate.
- Do not send meshes to an LLM; send the scene graph.
- Do not put API keys in the frontend.
- Preserve object **ids** across ingest → reconstruct → ask.
- Filter highlight ids to the graph on the server.

## Pull requests

Describe:

- The behaviour and the test that locked it in
- Any API or graph field changes (camelCase JSON)
- What you could not verify in the browser (if UI)

Do not commit `.env`, `backend/.venv`, or scan dumps with private spaces.
