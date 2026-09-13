# Desktop playable rooms

InteLiDar can load furniture GLBs into its demo room and let you explore with a rigged avatar. You can also import a saved GLB room locally. Both room sources share the same movement and collision system.

This milestone targets desktop browsers with a keyboard and mouse. Mobile gameplay, touch controls, iPhone capture, and AI texture generation are deferred.

## Play in the demo

1. Run the API and frontend using `npm run backend` and `npm run dev` in separate terminals.
2. Finish or skip the scan sweep, then select **AI Reconstruct**.
3. The dining chairs, table, shelf, and monitor appear using the existing asset library. Use **Edit** to rearrange furniture if needed.
4. Select **Play** once assets finish loading. The casual avatar starts in a clear part of the room.

| Input | Action |
| --- | --- |
| WASD or arrow keys | Move relative to the camera |
| Hold Shift | Run |
| Drag the scene with the left mouse button | Rotate the following camera |
| Escape or **Exit play** | Return to inspection |
| **Reset position** | Return to the starting point |

The character stays on supported floors, slides along walls, and is blocked by furniture. Idle, walk, and run animations follow actual movement. Jumping, climbing, and pushing furniture are not included. The camera moves closer when a wall or other object would obstruct it.

Switching away from the browser clears movement inputs and pauses play. Select **Resume** when you return. Exiting play preserves your demo furniture edits and restores the inspection camera.

## Import a saved room

Local import runs in the browser and remains available if the demo API is offline. No scan file is uploaded.

1. Select **Import room** and choose a `.glb` file.
2. In the setup preview, choose the model's units: meters, centimeters, or millimeters. Check the displayed room dimensions.
3. Drag to orbit or scroll to zoom. Click an open, level part of the floor to place the avatar preview. The app checks floor support and headroom before accepting the position.
4. Select **Open room**, then **Play**. You can import another file or select **Back to demo** from inspection.

The room is kept for the current browser session. Refreshing requires selecting the file again. Cancelling an import or encountering an invalid file leaves the previous room available.

### Supported files

- A self-contained static GLB, with embedded geometry and textures; external resource URLs are rejected.
- At most **50 MiB** and **250,000 rendered triangles**, including mesh instances.
- A single-level room using glTF's Y-up orientation. Select the unit conversion during setup.
- Existing materials and textures are preserved. Draco and Meshopt geometry compression are supported with bundled decoders. KTX2 textures are not supported; export PNG or JPEG textures instead.
- Animated meshes, skinning, morph targets, point clouds, and line-only models are unsupported.

Imported geometry supplies the physical surfaces: actual doorways remain open, and missing floor patches remain holes. Import does not repair geometry, infer furniture labels, replace objects, or generate textures. Use a complete floor surface and choose a clear starting point. The character resets if it falls below the room.

## Development

The backend launcher selects `backend/.venv/Scripts/python.exe` on Windows and `backend/.venv/bin/python` on macOS/Linux. Both `npm run backend` and `npm run test:backend` use it. Set `INTELIDAR_PYTHON` to an explicit Python executable path to use a different environment.

For a new Windows environment, run from the repository root in PowerShell:

```powershell
python -m venv backend/.venv
& ./backend/.venv/Scripts/python.exe -m pip install -e './backend[dev]'
npm install
npm run backend
```

See [Getting started](./getting-started.md) for other platforms and environment configuration. `npm test` runs launcher tests, frontend tests, backend tests, and the desktop Playwright flows. `npm run build` verifies the production bundle.

Frontend room adapters normalize the demo graph or imported mesh into meter-scaled visual geometry, bounds, colliders, and a spawn position. Gameplay consumes that shared environment independently of the capture source. A future scan adapter can supply the same interface without changing character controls.
