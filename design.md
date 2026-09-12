# InteLiDar Design

Engineering map for this repository. Product intent lives in [README.md](./README.md). Setup, API, and TDD details live under [docs/](./docs/).

**TDD is required.** Write a failing test before production code. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/development.md](./docs/development.md).

## Goal

Turn a real LiDAR room scan into an interactive semantic digital twin.

LiDAR supplies measured geometry. AI supplies labels, materials, cleanup, and question answering. The viewer highlights answers in 3D and lets the user rearrange movable objects on the floor.

## Non-goals (MVP)

- Photorealistic or fully generative 3D reconstruction
- Multi-room mapping and persistent memory
- Live AR overlays
- Inventing geometry the scan did not measure
- Shipping OpenAI keys to the browser

## Current status

The first slice is a **browser UI over a mock meeting room**, with a FastAPI scene graph behind it.

| Layer | Status |
| --- | --- |
| React + R3F 3D viewer | In place |
| HUD: reconstruct, ask, edit | In place |
| Floor drag for furniture / equipment | In place |
| Scene graph API (ingest / reconstruct / ask) | In place |
| Geometry + demo-id reconstruct | In place |
| OpenAI ask adapter (stubbed in tests, heuristic fallback) | In place |
| Vitest (edit, HUD gating, API client) | In place |
| Playwright demo E2E | In place |
| Real LiDAR / RoomPlan import | Not started |
| Computer vision pipeline | Not started |
| LLM-driven reconstruct | Not started |

Until real capture exists, `POST /scene/ingest` with an empty body returns the demo scan with semantics stripped.

## Demo state machine

```text
raw  →  analysing  →  twin
 │         │            │
 │         │            ├─ materials + labels
 │         │            ├─ spatial questions + highlights
 │         │            └─ edit still allowed (drag writes the twin graph)
 │         └─ staged classification log; edit disabled
 └─ wireframe mesh, unlabelled objects, reconstruct CTA
```

1. User sees a rough unlabelled mesh.
2. **AI Reconstruct** posts the current graph, then plays `analysisSteps` in the HUD.
3. The scene becomes a labelled twin. Object **ids stay the same**.
4. Questions highlight matching object ids.
5. **Edit** lets furniture and equipment slide on the floor; openings stay fixed.

`App` keeps both the raw ingest graph and the twin graph so reconstruct can preserve user moves made before reconstruct.

## Target architecture

```text
Capture (iPhone / iPad LiDAR)
        → raw mesh + RGB frames
Vision  → detections, segments, openings
Scene   → semantic scene graph (source of truth)
Reason  → classify, materials, Q&A, highlight ids
Viewer  → Three.js digital twin + HUD
```

Keep geometry, semantics, and presentation separate.

| Concern | Owns | Does not own |
| --- | --- | --- |
| Capture | Mesh, RGB, room bounds | Labels |
| Vision | Detections in image / 3D | Chat copy |
| Scene graph | Canonical objects, poses, confidence | WebGL |
| Reasoner | Structured answers over the graph | Camera controls |
| Viewer | Render + highlight + HUD + drag | Inventing objects |

Today capture and vision are skipped. Ingest produces a graph. Reconstruct and ask mutate or query that graph. The viewer never invents objects.

## Semantic scene graph

Canonical JSON the rest of the system reads and writes. Field names on the wire are **camelCase** (`highlightIds`, `analysisSteps`). Pydantic models accept both aliases.

```ts
type SceneGraph = {
  room: {
    id: string
    name: string
    width: number
    depth: number
    height: number
    units: 'm'
  }
  objects: SceneObject[]
}

type SceneObject = {
  id: string
  type: string
  label: string
  category: 'structure' | 'furniture' | 'opening' | 'equipment'
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  material?: string
  confidence?: number
  color?: string
}
```

Rules:

- Positions are metres, **Y-up**, room origin at **floor centre**.
- `id` is stable across ingest → reconstruct → ask so highlights and edits survive mode changes.
- The assistant returns `{ reply, highlightIds }`. The viewer only paints those ids. The API drops unknown ids.
- Do not prompt an LLM with raw meshes. Send this graph (plus optional image refs later).
- Ingest **strips** type, label, material, and confidence so reconstruct has work to do.
- Reconstruct looks up demo ids first, then classifies unknown geometry by size.

Full field semantics and heuristic tables: [docs/scene-graph.md](./docs/scene-graph.md).

## Frontend

Vite + React + Three.js + React Three Fiber.

```text
src/
  App.tsx                 # mode, graphs, highlights, ask, edit, API wiring
  api/scene.ts            # ingest / reconstruct / ask client
  components/Hud.tsx      # chrome only
  scene/editScene.ts      # drag eligibility + room clamp
  scene/ViewerScene.tsx   # meshes, lights, labels, pointer drag
  scene/types.ts          # scene graph types
```

Tests: `src/**/*.test.ts{,x}`, `e2e/demo.spec.ts`. Details: [docs/frontend.md](./docs/frontend.md).

- `App` holds mode, query, reply, `highlightedIds`, edit/drag flags, the ingest graph, and the twin graph.
- `ViewerScene` is a pure projection of `{ mode, highlightedIds, graph, editing }`.
- Edit mode lets `furniture` and `equipment` slide on the floor plane; `opening` stays fixed. Y is unchanged. Positions are clamped to the room footprint minus half-size.
- Orbit is disabled only while a piece is being dragged.
- Reconstruct is disabled until ingest succeeds. Ask is disabled until `twin`. Edit is disabled during `analysing`.

UI surfaces: [docs/frontend.md](./docs/frontend.md).

## Backend

Python FastAPI. One job: graph in, graph or answer out.

| Endpoint | Input | Output |
| --- | --- | --- |
| `GET /health` | — | `{ status: "ok" }` |
| `POST /scene/ingest` | optional room + objects (empty body = demo scan) | raw `SceneGraph` |
| `POST /scene/reconstruct` | `{ graph }` | labelled graph + `analysisSteps` |
| `POST /scene/ask` | `{ graph, question }` | `{ reply, highlightIds }` |

`highlightIds` are always filtered to ids that exist on the graph. Tests inject a stub `Reasoner`. Production uses OpenAI when `OPENAI_API_KEY` looks like a real `sk-` key, otherwise a heuristic fallback.

Run from repo root: `npm run backend` (port 8000). Vite proxies `/scene` and `/health`. Interactive OpenAPI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Contract details: [docs/api.md](./docs/api.md).

## Test seams

TDD targets, in order of leverage:

1. **`heuristic_ask` / `ask_scene`** — chairs, door, equipment, obstacles, blank questions, hallucinated ids filtered
2. **Ingest** — demo ids stable, semantics stripped, caller geometry kept
3. **Reconstruct** — demo ids labelled, unknown boxes classified by size, analysis steps
4. **HTTP contract** — ingest → reconstruct → ask; stub reasoner; 400 on blank question
5. **`moveObject` / `canDragObject`** — furniture moves, openings do not, clamp to room, unknown id is a no-op
6. **HUD gating** — reconstruct/ask/edit availability per mode (`Hud.test.tsx`)
7. **API client** — stub `fetch` for ingest / reconstruct / ask
8. **Demo E2E** — Playwright reconstruct → ask chairs → Edit (`e2e/demo.spec.ts`)
9. **LLM adapter** — given graph JSON, returns valid `{ reply, highlightIds }` (stub the model)

Do not start with snapshot tests of the canvas. Coverage map: [tests/AUDIT.md](./tests/AUDIT.md).

## MVP build order

1. Viewer + mock graph (done)
2. Tests around ask and mode transitions (done as ingest / reconstruct / ask)
3. FastAPI scene APIs + frontend wiring (done)
4. Edit drag on the graph (done)
5. Replace demo ingest with imported glTF / RoomPlan mesh
6. Vision pass: attach types and confidence from images
7. Richer LLM reconstruct (not only ask)
8. Materials from vision and optional clean asset swap (nice to have)

## Risks

- Real scans are noisier than boxes; keep the graph API stable so the viewer can stay simple.
- Keyword Q&A will not generalise; isolate it behind `Reasoner.ask` so an LLM can drop in.
- Full mesh cleanup is out of scope; prefer labels, materials, and asset replacement.
- Reconstruct currently special-cases demo object ids. Geometry heuristics are the path for non-demo captures; do not teach the viewer those ids.
