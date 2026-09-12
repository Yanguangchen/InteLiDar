# Frontend

Vite + React 19 + Three.js + React Three Fiber + Drei. Entry: [index.html](../index.html) → [src/main.tsx](../src/main.tsx) → [src/App.tsx](../src/App.tsx).

The canvas is a **projection** of the scene graph. The HUD is chrome. Domain rules (drag, clamp) live in [src/scene/editScene.ts](../src/scene/editScene.ts), not in JSX.

## File map

```text
src/
  main.tsx
  App.tsx                 # state machine + API
  index.css               # HUD layout, dark theme
  api/scene.ts            # POST helpers
  api/scene.test.ts
  components/Hud.tsx      # overlay UI only
  components/Hud.test.tsx # mode gating
  scene/
    types.ts              # graph + mode types
    ViewerScene.tsx       # room, objects, lights, drag, sweep
    editScene.ts          # canDragObject, moveObject
    editScene.test.ts
  test/
    setup.ts              # Testing Library cleanup
    sampleGraph.ts
```

Vite proxies `/scene` and `/health` to `http://127.0.0.1:8000` ([vite.config.ts](../vite.config.ts)). Vitest uses **jsdom** and includes `src/**/*.test.ts{,x}`. Demo click-path: [e2e/demo.spec.ts](../e2e/demo.spec.ts).

## Modes

| Mode | Canvas | HUD |
| --- | --- | --- |
| `raw` | Dark, wireframe room and boxes, LiDAR sweep | Reconstruct CTA, object list as `unknown`, ask disabled |
| `analysing` | Same as raw | Classification log; edit forced off |
| `twin` | Lit materials, glass, labels, no sweep | Ask enabled, object types shown |

`displayGraph` is `twinGraph` in twin mode, otherwise the ingest `graph`. Reconstruct result is stored on `twinGraph` immediately, but the canvas stays on the raw graph until the log finishes and `mode` becomes `twin`.

## HUD surfaces

[src/components/Hud.tsx](../src/components/Hud.tsx)

- **Top bar** — brand, Edit toggle, status pill (`Raw mesh` / `Analysing scene` / `Semantic twin`)
- **Left panel** — room name (or *Unlabelled scan*), size, object count (hidden until twin), source line, object list
- **Centre CTA** — Reconstruct in `raw`; analysis `<ol>` in `analysing`; hidden in `twin`
- **Ask bar** — input, submit, three suggestions, reply, error

Suggestions:

```text
Show me all the chairs.
Where is the door?
What objects could obstruct movement through this room?
```

Edit hint when the toggle is on: *Drag tables, chairs, and equipment. Doors and windows stay fixed.*

Pointer events: the HUD root is `pointer-events: none`; children opt back in so orbit works on the canvas.

## Viewer

[src/scene/ViewerScene.tsx](../src/scene/ViewerScene.tsx)

- Camera starts at `[6.4, 4.2, 6.8]`, fov 42, shadows on.
- `OrbitControls`: damping, polar limit, distance 3–16, target `[0, 1, 0]`. Disabled while `dragging`.
- `RoomShell`: floor, ceiling, four walls. Twin mode uses plaster / wood / translucent +X wall; raw mode is dark wireframe.
- Each graph object is a `boxGeometry` of `object.size`. Twin uses `object.color`, glass (`material === 'glass'`) and metal roughness/metalness. Highlights set teal emissive and a `.label-hot` HTML caption.
- Fallback room if `graph` is null: same dimensions as the demo fixture, so the shell still renders while ingest is in flight.

### Scan sweep

In non-twin modes a thin teal plane oscillates along Z inside the room (`ScanSweep`). Cosmetic only.

### Highlight vs edit emissive

Highlighted objects use a strong teal emissive. Draggable objects in edit mode use a weaker emissive so they read as movable without looking like ask results.

## Edit interaction

1. User toggles Edit (`mode !== 'analysing'` and graph loaded).
2. Hover on a draggable mesh → `grab`. Pointer down → `dragging = true`, orbit off, `grabbing`.
3. `pointermove` on `window` raycasts to the y = 0 plane and calls `moveObject` through `onMoveObject`.
4. Pointer up clears dragging.

`App.onMoveObject` writes `twinGraph` in twin mode and `graph` otherwise. Reconstruct is always called with the ingest `graph`, so twin-mode drags are not sent until a future reconstruct-from-twin exists.

## API wiring

On mount: `ingestScene()` → `setGraph`. Failure → *Backend unavailable. Start the API on port 8000.*

Reconstruct: `reconstructScene(graph)` → `twinGraph` + `analysisSteps` → `mode = 'analysing'`. Timers reveal steps; last step + 700 ms → `twin`. Failure → *Reconstruct failed.*

Ask: only if `mode === 'twin'` and `twinGraph` and non-empty question. Sets `reply` and `highlightedIds`. Failure → *Ask failed.*

There is no loading spinner beyond disabled buttons (`!graph` on reconstruct, `!reconstructed` on ask).

## Styling

[src/index.css](../src/index.css): dark HUD, Outfit + IBM Plex Mono (loaded in `index.html`), accent `#3ee0c2`. Prefer visual checks in the browser after layout tweaks; HUD **gating** is covered in `Hud.test.tsx`.

## What to test (and what not to)

Do not snapshot WebGL. Cover:

- `canDragObject` / `moveObject`
- `Hud` enabled/disabled controls per mode
- API client paths (`src/api/scene.test.ts`)
- Demo click-path in Playwright (reconstruct → ask chairs → Edit)

If you extract a `selectDisplayGraph(mode, graph, twinGraph)` or reconstruct-timer helper, test that function, not `ViewerScene`. Pointer-drag of a chair in headless Chromium is out of scope; unit tests own the clamp math.
