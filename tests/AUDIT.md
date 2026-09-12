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
| HUD gating (raw/analysing/twin) + edit affordance | `src/components/Hud.test.tsx` | Component |
| Frontend API client paths and errors | `src/api/scene.test.ts` | Unit |
| Demo E2E: reconstruct → ask chairs → Edit | `e2e/demo.spec.ts` | Playwright |

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
- Canvas visual regression.
