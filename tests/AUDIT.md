# Test suite audit

Checked against the live product: ingest → reconstruct → ask → edit/drag.

## Coverage now

| Area | Where | Notes |
| --- | --- | --- |
| Demo ingest → unknown objects, stable ids | `backend/tests/test_ingest.py` | Domain |
| Reconstruct labels + geometry heuristics | `backend/tests/test_reconstruct.py` | Domain |
| Ask chairs/door/window/equipment/obstacles + id filter | `backend/tests/test_ask.py` | Domain |
| HTTP ingest/reconstruct/ask, CORS, placeholder key | `backend/tests/test_api.py` | API |
| Furniture drag rules (floor, clamp, openings fixed) | `src/scene/editScene.test.ts` | Unit |
| Sweep geometry: bearings, beam aim, reveal windows, easing | `src/scene/scanReveal.test.ts` | Unit |
| Return-cloud sampling: on-surface, deterministic, windowed | `src/scene/scanCloud.test.ts` | Unit |
| Sweep clock: timing, skip, reduced motion | `src/scene/useScanProgress.test.ts` | Unit |
| Canvas animation clock defaults and rate limiting | `src/scene/scanAnim.test.ts` | Unit |
| Glass specular tracking (`--gx` / `--gy`) | `src/components/useSpecular.test.ts` | Unit |
| Graphics presets, defaults, persistence, corrupt storage | `src/settings/graphics.test.ts` | Unit |
| Graphics menu: open/close, switches, presets, escape, click-away | `src/components/GraphicsMenu.test.tsx` | Component |
| HUD gating (raw/sweeping/analysing/twin), progressive list, row selection | `src/components/Hud.test.tsx` | Component |
| Frontend API client paths and errors | `src/api/scene.test.ts` | Unit |
| Serverless path rewriting, both host behaviours | `backend/tests/test_asgi.py` | Unit |
| Demo E2E: sweep → skip → reconstruct → ask chairs → Edit | `e2e/demo.spec.ts` | Playwright |
| Reduced motion skips the sweep end to end | `e2e/demo.spec.ts` | Playwright |
| Graphics menu drops effects, persists across reload, keeps the demo working | `e2e/demo.spec.ts` | Playwright |

Run everything with `npm test` (Vitest, pytest, Playwright). How to add tests: [docs/development.md](../docs/development.md).

## Gaps that were closed

1. No E2E for the demo click-path.
2. HUD reconstruct/ask/edit gating untested.
3. `src/api/scene.ts` untested.
4. Window and equipment ask heuristics unimplemented in tests.
5. CORS allow-list untested.
6. `npm test` did not include E2E.

## Still out of scope

- WebGL pixel-drag of a chair (flaky in headless Chromium). Edit is covered by the toggle, hint, and `editScene` unit tests.
- Live OpenAI network calls (stubbed / heuristic only).
- Canvas visual regression. The sweep is covered as geometry (`scanReveal`, `scanCloud`) and as gating (`Hud`, E2E), never as pixels.
- Shader compilation. `ScanPoints` and `SensorBeacon` are checked by running the app, not by a test.
