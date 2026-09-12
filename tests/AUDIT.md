# Test suite audit

Checked against the live product: ingest → reconstruct → ask → edit/drag.

## Already covered

| Area | Where | Notes |
| --- | --- | --- |
| Demo ingest → unknown objects, stable ids | `backend/tests/test_ingest.py` | Domain |
| Reconstruct labels + geometry heuristics | `backend/tests/test_reconstruct.py` | Domain |
| Ask chairs/door/obstacles + hallucinated id filter | `backend/tests/test_ask.py` | Domain |
| HTTP ingest/reconstruct/ask + stub reasoner | `backend/tests/test_api.py` | API |
| Furniture drag rules (floor, clamp, openings fixed) | `src/scene/editScene.test.ts` | Unit |

## Gaps found

1. **No E2E.** Nothing booted the Vite app and clicked Reconstruct → Ask → Edit.
2. **HUD untested.** Reconstruct/ask gating, edit toggle, analysis log, and errors had no component tests.
3. **API client untested.** `src/api/scene.ts` could break paths or error handling without failing pytest.
4. **Ask heuristics incomplete.** Window and equipment questions were implemented but not asserted.
5. **CORS untested.** Vite origin allow-list had no test.
6. **README was stale.** `npm test` already ran frontend + backend, but the README still said pytest only.

WebGL pixel-drag is out of scope for E2E (flaky). Edit is proven by the toggle, hint, and `editScene` unit tests.
