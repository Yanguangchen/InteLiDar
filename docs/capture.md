# Capture

InteLiDar has a native RoomPlan capture source project for **LiDAR-equipped iPhones**, plus a scan-file importer in the web viewer. Safari does not access the LiDAR sensor directly.

The iOS source is in [ios/](../ios/README.md). It must be built and installed using Xcode on a Mac; there is no signed app or TestFlight release in this repository. Native compilation and real-device scanning remain unverified in the Windows development environment.

## Use an iPhone scan

1. Build and install **InteLiDar Capture**, following [the iOS setup guide](../ios/README.md).
2. On a supported iPhone, tap **Start scan**, follow RoomPlan's guidance, then **Finish**.
3. Choose **Export scan → Save to Files**.
4. Open InteLiDar in Safari and choose **Import scan**. Select the `.intelidar.json` export.

The scan opens directly as a semantic twin with RoomPlan's labels and measured object poses. Appearance editing and the spatial assistant operate on this imported graph. The source reads **iPhone LiDAR · RoomPlan**. Importing validates the file before replacing the current scene; a failed import preserves the previous scene. Viewing an export does not require the API, while asking questions does.

Only the versioned InteLiDar export is accepted. Generic RoomPlan JSON, USDZ, OBJ, GLB, PLY, LAS, and E57 are not supported. The importer expects normalized room bounds and object boxes, not an arbitrary mesh or point cloud.

## The initial scene is still a demo

Loading the website requests `POST /scene/ingest {}`. This returns the nine fixture objects from `backend/app/fixtures.py`. No device is discovered, connected, or scanned by that request.

The initial sweep is presentation: its beam, point cloud, and return counter are generated in the browser. The HUD says **Demo playback**, **no device connected**, and **simulated returns**. These effects are suppressed for imported RoomPlan scenes; a native capture is not presented as a live Safari sensor session.

## Data and limitations

The native app checks `RoomCaptureSession.isSupported` before starting and requests camera permission. Unsupported phones have capture disabled. There is no photo-based fallback. A simulator can exercise the unsupported state and exporter tests, but cannot scan.

Exports contain the enclosing room dimensions, full local object extents, centres, XYZ Euler rotations, RoomPlan labels, and appearance defaults. Origin is normalized to the floor centre, coordinates are right-handed/Y-up, and units are metres. Raw depth, camera images, scanned textures, and arbitrary wall polygons are not exported. Furniture detail and colors in the web viewer are generated representations, not captured surface detail.

The room shell is an enclosing rectangle; L-shaped rooms, angled walls, curves, and open passageways are approximated. Files are limited to 5 MB and 500 objects, with positive dimensions no larger than 50 m. Exports use namespaced ids. The backend preserves `source: roomplan` and device labels through reconstruction and avoids demo id lookup for these scenes.

The native app makes no network requests. The user explicitly saves/shares its export. Importing is local to the browser; asking a question sends the graph to the API and its configured reasoner. Reloading clears the imported scene and appearance edits; the saved export can be imported again.

## Existing ingest API

`POST /scene/ingest` remains the legacy demo/custom-box endpoint: it strips type, label, material, and confidence. Its `source` request field is not a RoomPlan import selector. The new browser import bypasses this endpoint so that RoomPlan's labels survive; the resulting graph carries `source: roomplan` to reconstruction and ask.

See [the native exporter and installation guide](../ios/README.md), [scene graph](./scene-graph.md), and [HTTP API](./api.md). Browser tests exercise the export contract, validation, mobile import, editing, and ask. Real sensor capture must still be verified on an iPhone after an Xcode build.
