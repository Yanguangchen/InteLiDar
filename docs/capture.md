# Capture

Where the geometry actually comes from, what the on-screen sensor is, and what a real scanner would have to do to replace it.

Read this before wiring a device to InteLiDar, and before telling anyone the scan is live.

## Status: no scanner is connected

**The LiDAR scanner is not functional. There is no API call to any hardware, because there is no hardware integration in this repository.**

Specifically, none of the following exists in this codebase:

- a device driver, or any serial, USB, Bluetooth, or network device discovery
- an ARKit / RoomPlan bridge, or an iOS / iPadOS companion app
- a point-cloud reader or an importer for `.ply`, `.las`, `.e57`, `.usdz`, or `.obj`
- any camera capture or depth-frame handling
- a file-upload route of any kind

The browser can now open a saved, self-contained GLB through **Import room**, including its embedded textures. This is local file import with floor/unit setup and desktop gameplay, not device capture or a backend upload. See [playable rooms](./playable-rooms.md).

The backend's only outbound network call is to OpenAI, and only for [ask](./api.md#post-sceneask). Its dependencies are FastAPI, Uvicorn, Pydantic, python-dotenv, OpenAI, and httpx — no sensor or geometry libraries.

"LiDAR" in this repo names the **shape of the data** — measured room bounds and box poses — not a device that produced it. [README](../README.md) and [roadmap](./roadmap.md) both list real capture as *not started*; this page says exactly what stands in for it.

## What happens when you load the app

```text
src/App.tsx  (on mount)
  └─ ingestScene()                      src/api/scene.ts
       └─ POST /scene/ingest  { }       over the Vite proxy to 127.0.0.1:8000
            └─ ingest_capture()         backend/app/services/ingest.py
                 └─ demo_twin_graph()   backend/app/fixtures.py
                      └─ strip semantics, return
```

The whole round trip is local HTTP between two processes on your machine. Nothing is measured, sampled, or read from a device. The nine objects and the 7.4 × 5.2 × 2.8 m room are Python literals in [fixtures.py](../backend/app/fixtures.py).

The HUD does not hide this: the left panel's **Source** row reads *LiDAR demo mesh* in every mode.

## The sweep is a drawing, not a measurement

The sensor that turns on the spot at the start of the demo is a rendered metaphor built in the browser, described in [frontend.md](./frontend.md#the-opening-sweep). It runs **after** the data has already arrived, and re-orders the presentation of a graph that was complete before the first frame.

Every number it shows is derived from the fixture or from elapsed time:

| On screen | Computed from | Measured? |
| --- | --- | --- |
| Beam heading | `beamRotationY(progress)` — a linear function of elapsed time | No |
| Sensor position | `sensorOrigin(room)` — floor centre, eye height, from the room bounds | No |
| Order objects appear | `scanBearing()` of each fixture position | No |
| Point cloud | `scanCloud.ts` — a seeded PRNG scattering points over box surfaces | No |
| *N* returns | `capturedPoints(progress)` — `progress × 214,000`, a constant in `scanReveal.ts` | No |
| *N* volumes found | Fixture objects whose reveal window has opened | No — a row count |
| Room bounds, object poses | `fixtures.py` literals | No |

The proof that none of it is data: the whole sweep can be switched off in the **Graphics** menu (see [frontend.md](./frontend.md#graphics-settings)) and nothing is lost. The room, the object list, reconstruct and ask are identical with the beam, the cloud and the animation all disabled — because the graph was already complete.

If you need the app to stop implying a live capture, the honest change is to the **Source** row and the capture card's wording, not to the animation.

## The seam: `POST /scene/ingest`

This endpoint is the entire hardware-facing surface. It is a **pull-free seam**: the backend never reaches out to a device, discovers one, or polls one. A scanner integration is a *client* that pushes a finished payload here.

Full request and response shapes are in [api.md](./api.md#post-sceneingest). The behaviour below was verified against a running backend, because some of it is easy to get wrong:

| Request | Result |
| --- | --- |
| `{}`, or `objects` omitted / `null` | The demo fixture: 9 objects, semantics stripped |
| `{"objects": []}` | **0 objects**, demo room bounds — not the same as omitting the key |
| `room` + `objects` | Your bounds and your boxes, semantics stripped |
| `units` other than `"m"` | `422` — metres are the only accepted unit |
| An object far outside the room | **Accepted.** Geometry is not validated against the bounds |
| `"source": "anything"` | Accepted by the model, then **never read and never echoed** |

Two things a client author should know:

- **`category` is the only semantic field ingest keeps.** `type`, `label`, `material` and `confidence` are cleared; `id`, `position`, `size`, `rotation`, `color` and `category` survive. Category decides whether an object is draggable and whether it is captioned *Unknown opening* or *Unknown object*, so send it. Full stripping rules: [scene-graph.md](./scene-graph.md#ingest-stripping).
- **`color` survives stripping.** An empty-body ingest returns fixture colours on objects typed `unknown`. The raw viewer ignores colour, so it never shows, but do not read meaning into it.

`IngestRequest.source` exists in [models.py](../backend/app/models.py) and defaults to `"demo"`. Nothing consumes it. It is a placeholder for the provenance field a real integration needs, not a working one.

## Writing a real scanner client

The split of work is: **the device side does the conversion, the backend accepts only a finished graph.** Keep it that way — it is why the viewer and the reasoner do not change when capture lands.

Your exporter must satisfy the [scene graph](./scene-graph.md) contract:

- metres, Y-up, right-handed
- origin at the **centre of the floor**, `y = 0` at the floor
- `position` is the **box centre**; `size` is **full extents**, not half-extents
- `id` stable for the life of a session — reconstruct and ask both key on ids

### From RoomPlan / ARKit

A companion app is the shortest path, because RoomPlan already produces room bounds and object boxes rather than a raw cloud. The conversion work is:

1. Capture the room model on device.
2. **Re-origin.** An ARKit session's origin is wherever the scan started, not the floor centre. Derive the floor rectangle, take its centre, and subtract it from every position.
3. **Flatten transforms.** Each surface and object arrives as a 4×4 transform plus dimensions; the graph wants a centre position, full extents, and optionally Euler rotation.
4. **Derive room bounds** — `width` on X, `depth` on Z, `height` floor to ceiling.
5. **Map categories** onto the graph's four: doors and windows → `opening`; tables, chairs, storage → `furniture`; screens → `equipment`.
6. POST the result to `/scene/ingest` and let it strip the rest.

Check the exact RoomPlan type and category names against Apple's current documentation before you write the mapping — they are not pinned anywhere in this repo, and this page does not restate them.

### From a raw point cloud

There is no path today. The graph cannot express a cloud; it carries boxes only. The missing step is segmentation into oriented bounding boxes — the *vision* stage in [architecture.md](./architecture.md#intended-pipeline), also not started. A cloud viewer would additionally need a graph field for the cloud itself, which would be an additive change.

## Gaps to close before this is a real capture path

Roughly in the order they will bite:

1. **A rectangular room.** `Room` is one axis-aligned box. Real rooms are not rectangles, and RoomPlan returns arbitrary wall polygons. Anything L-shaped loses its shape on the way in.
2. **Semantic capture still needs normalization.** The demo viewer now applies object rotation, including asset placement, scan sampling, and drag bounds. Device transforms still need conversion into the graph's meter-scaled, Y-up convention ([scene-graph.md](./scene-graph.md#object)).
3. **Id collision with the fixture.** Reconstruct restores demo semantics by id lookup ([reconstruct.py](../backend/app/services/reconstruct.py)). A real scan that happens to send `table-1` inherits the demo's conference table. Namespace real ids.
4. **`source` is ignored.** Provenance needs to reach the graph so the HUD can stop saying *LiDAR demo mesh* when the data is real. Additive field on `SceneGraph`, then thread it to the panel.
5. **No geometry validation.** Objects outside the room, zero or negative sizes, and NaNs are all accepted.
6. **No auth, no size limit.** The endpoint is unauthenticated and unbounded — fine on loopback, not fine anywhere else.
7. **No persistence.** Nothing is stored. Every reload re-ingests from scratch.

The sweep animation needs no change for any of this: it reveals whatever graph it is handed, in bearing order from that graph's own room centre. A real scan will sweep in the same way.

## Verify it yourself

With the backend running (`npm run backend`):

```bash
# The demo path the app actually uses: nine objects, all "unknown".
curl -s -X POST http://127.0.0.1:8000/scene/ingest \
  -H 'Content-Type: application/json' -d '{}' | head -c 400

# A "capture" from a client. Semantics are stripped; "source" vanishes.
curl -s -X POST http://127.0.0.1:8000/scene/ingest \
  -H 'Content-Type: application/json' -d '{
    "room": {"id":"lab","name":"lab","width":4,"depth":3,"height":2.5,"units":"m"},
    "objects": [{"id":"blob-1","position":[1,0.4,2],"size":[2,0.8,1],
                 "type":"table","label":"Conference table","category":"furniture"}],
    "source": "iphone-15-pro-roomplan"
  }'
```

The second response comes back with `type: "unknown"`, `label: "Unknown object"`, `material: null`, no `source` — and `category: "furniture"` preserved. That is the whole hardware contract.

Contract tests: [backend/tests/test_ingest.py](../backend/tests/test_ingest.py) and [backend/tests/test_api.py](../backend/tests/test_api.py).
