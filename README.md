# InteLiDar

> Scan reality. Let AI understand and reconstruct it.

InteLiDar turns a physical room into an interactive **semantic digital twin**.

LiDAR supplies measured geometry. AI supplies labels, materials, cleanup, and spatial questions. The 3D viewer highlights answers in place.

**LiDAR gives the shape. AI gives the understanding and appearance.**

This repository is a hackathon MVP. Capture and computer vision are designed in; the running app uses a **demo meeting-room scan**, a FastAPI scene graph, and a React Three Fiber viewer.

## What works today

| Capability | Status |
| --- | --- |
| Browser 3D viewer (raw wireframe → labelled twin) | Working |
| Demo LiDAR-style ingest (unlabelled boxes + room bounds) | Working |
| Reconstruct: labels, materials, analysis log | Working |
| Spatial assistant: ask → reply + 3D highlights | Working |
| Floor-plan edit: drag furniture and equipment | Working |
| OpenAI ask adapter (heuristic fallback without a key) | Working |
| Real iPhone / iPad RoomPlan import | Not started |
| Image-based detection and segmentation | Not started |

Open [http://localhost:5173](http://localhost:5173) after setup. Press **AI Reconstruct**, then ask *Show me all the chairs.*

## Documentation

| Doc | Contents |
| --- | --- |
| [Getting started](./docs/getting-started.md) | Install, env, run, troubleshooting |
| [Design](./design.md) | Engineering map, constraints, build order |
| [Architecture](./docs/architecture.md) | Layers, data flow, frontend state |
| [HTTP API](./docs/api.md) | Ingest, reconstruct, ask, examples |
| [Scene graph](./docs/scene-graph.md) | Canonical JSON, coordinates, classification |
| [Frontend](./docs/frontend.md) | Viewer, HUD, reconstruct UX, edit mode |
| [Development](./docs/development.md) | TDD, tests, scripts, seams |
| [Test audit](./tests/AUDIT.md) | Coverage map and remaining gaps |

## Quick start

Requires **Node.js 20+** and **Python 3.11+**.

```bash
cp .env.example .env          # optional: set OPENAI_API_KEY for LLM ask
npm install

cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cd ..
```

Terminal 1 — API on port **8000**:

```bash
npm run backend
```

Terminal 2 — Vite on port **5173** (proxies `/scene` and `/health`):

```bash
npm run dev
```

```bash
npm test                      # Vitest + pytest + Playwright E2E
```

Without a real OpenAI key, ask uses a keyword reasoner over the scene graph. The key must stay in `.env` on the backend — never prefix it with `VITE_`.

Full walkthrough: [docs/getting-started.md](./docs/getting-started.md).

## Demo

1. Load the viewer. You see a **raw mesh**: wireframe room, unlabelled boxes, a LiDAR-style sweep.
2. Press **✨ AI Reconstruct**. Classification steps play in the HUD (`Unknown object → Chair × 4`, and so on).
3. The scene becomes a **semantic twin**: materials, labels, lighting.
4. Ask *Show me all the chairs.* Matching objects glow in the canvas.
5. Toggle **Edit** and drag tables, chairs, and equipment on the floor. Doors and windows stay fixed.

Suggested questions once reconstructed:

```text
Show me all the chairs.
Where is the door?
What objects could obstruct movement through this room?
```

## Problem

Useful 3D models of real rooms are still expensive to produce.

Traditional scans yield noisy meshes, missing surfaces, weak textures, and **no semantics**. A chair, a wall, and a doorway are all just geometry.

InteLiDar keeps the measured structure and adds a machine-readable scene on top of it.

## Solution

The intended pipeline is:

```text
LiDAR scan → room mesh + RGB frames
    → computer vision (detect, segment, openings)
    → semantic scene graph
    → AI cleanup, materials, Q&A
    → interactive digital twin
```

The MVP does not invent a room from images. A fixture graph stands in for the scan. Reconstruct classifies that graph. Ask reasons over it.

See [docs/architecture.md](./docs/architecture.md) for what runs versus what is planned.

## Core ideas

**Capture.** A LiDAR-capable iPhone or iPad records walls, floor, ceiling, openings, large objects, and metres-accurate bounds. The MVP uses `POST /scene/ingest` with an empty body as that scan.

**Understand.** RGB (later) and geometry (now) attach types, materials, and confidence to each object. Reconstruct never changes object ids, so highlights survive the mode change.

**Interact.** The spatial assistant returns `{ reply, highlightIds }`. The viewer only paints ids that exist on the graph. Edit mode moves furniture in the same graph the assistant reads.

## Architecture

```text
┌─────────────────────────┐
│ Capture (planned)       │
│ ARKit / RoomPlan        │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Semantic scene graph    │  ← source of truth (MVP starts here)
└────────────┬────────────┘
             ↓
     ┌───────┴────────┐
     ↓                ↓
 Reconstruct        Ask
 (labels)      (reply + ids)
     ↓                ↓
┌─────────────────────────┐
│ React + R3F viewer      │
│ HUD · highlights · edit │
└─────────────────────────┘
```

Keep geometry, semantics, and presentation separate. The graph is JSON. The canvas is a projection of it.

## Stack

| Layer | Choice |
| --- | --- |
| Viewer | Vite, React 19, Three.js, React Three Fiber, Drei |
| API | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| Ask | OpenAI chat completions (JSON) when `OPENAI_API_KEY` is set; otherwise heuristics |
| Tests | Vitest (`src/**/*.test.ts{,x}`), Pytest (`backend/tests`), Playwright (`e2e`) |

Planned, not in this repo yet: RoomPlan export, YOLO / Grounding DINO / SAM, glTF asset swap.

## Why LiDAR

LiDAR measures the room. The model does not have to invent walls and furniture from pixels alone.

AI is used where it is strongest: classifying objects, choosing materials, reasoning about layout, answering questions, and driving the HUD.

## Applications

- **Construction** — site twins, hazards, change between scans
- **Robotics** — semantic maps of unfamiliar rooms
- **Interior design** — editable layout from a phone scan
- **Real estate** — interactive property models
- **Warehousing** — inventory location and circulation
- **Facility management** — searchable equipment in space

## Vision

Most AI sees text and images. InteLiDar adds **space**: positions, dimensions, and distances.

The long-term goal is a spatial memory layer — persistent, queryable digital worlds built from real environments.

**InteLiDar transforms a LiDAR scan into an AI-enhanced semantic digital twin.**

Scan a room. Recover its structure. Let AI name what is there. Then work with the physical world through its digital copy.
