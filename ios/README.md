# InteLiDar Capture for iPhone

Native RoomPlan capture for **LiDAR-equipped iPhones only**, running iOS 16 or later. Safari remains the viewer and editor. There is no camera-only fallback.

The unsigned iPhone app has now been built successfully on a Mac with Xcode 26.6. Device signing, installation, and real scanning are still pending; see [local activation status](./ACTIVATION-STATUS.md).

For a Codex-assisted Mac setup, use the [copy-paste activation handoff](./CODEX-HANDOFF.md).

## Build and install

1. On a Mac with Xcode and the iOS SDK installed, open `InteLiDarCapture.xcodeproj`.
2. Choose the **InteLiDarCapture** scheme. Under **Signing & Capabilities**, choose your development team and change the bundle identifier if necessary. Select your team for the test target too if running tests on device.
3. Connect a LiDAR-equipped iPhone, enable Developer Mode if Xcode requests it, and choose the phone as the run destination.
4. Build and run. Allow camera access when prompted by **Start scan**.

`RoomCaptureSession.isSupported` and the phone device idiom gate scanning before the camera session starts. Unsupported phones and simulators show an explanation with capture disabled. Installing the Safari website on the Home Screen does not install this native app.

This repository contains source, not a signed IPA or TestFlight release. **The native app compiles for iPhone using Xcode 26.6, but has not yet been installed or tested on a physical iPhone.** The successful unsigned build does not replace signing and a real-device capture test.

## Scan → Files → Safari

1. Tap **Start scan**, move slowly around one room, and follow RoomPlan's guidance. Include the floor, walls, doors, windows, and furniture.
2. Tap **Finish** and wait for processing. Review the native 3D preview.
3. Tap **Export scan**, then **Save to Files** in the share sheet.
4. Open InteLiDar in Safari. Tap **Import scan → Choose scan from Files** and select the `.intelidar.json` export.
5. The viewer opens the captured room as a semantic twin. Use **Edit** to move furniture and change appearance, or ask the spatial assistant about the room.

If testing from the same Wi-Fi network, run Vite with its configured LAN host and open `http://<computer-LAN-IP>:5173` on the phone. Run the Python API on the computer's loopback port 8000; Vite proxies API requests. `localhost` on the phone refers to the phone. A deployed viewer works too once the frontend and API changes are deployed.

The export contains room bounds, object dimensions, positions, rotations, categories, and generated appearance defaults. No camera images, raw depth frames, mesh triangles, or photo textures are exported. Opening a scan is local; **Ask** sends the graph to the site's API and its configured reasoner. The native app makes no network requests. Re-import the saved file after refreshing the browser; edits currently last for one page session.

## Geometry contract

The reasoning behind each rule, with the measured numbers, is in [capture geometry](../docs/capture-geometry.md).

- Format marker `intelidar.roomplan`, version `1`, source `roomplan`.
- Metres, Y up, right-handed; origin normalized to the centre of the enclosing floor rectangle.
- **The room is squared up before it is measured.** RoomPlan reports geometry in the AR session's world frame, whose heading is wherever the phone pointed at **Start scan**, not the room's walls. The exporter derives the dominant wall yaw (circular mean of 4θ, weighted by wall width) and rotates all geometry onto it first. Without this a 5 × 4 m room scanned 45° off axis exports as 6.4 × 6.4 m with its furniture on the diagonal. A room already square to the world is unchanged; the nearest alignment may transpose width and depth, which is still square.
- Floor height is taken from the walls, which run floor to ceiling, rather than from the lowest point of any object.
- Measurements are rounded to the millimetre and rotations to the microradian on the way out. `Float` is binary32 and `JSONEncoder` widens it to `Double`, so an unrounded 5.2 would reach the viewer — and the HUD — as `5.199999809265137`.
- Dimensions are full local extents; positions are box centres. Rotation is XYZ Euler in radians, including the gimbal-lock case.
- Room bounds enclose transformed walls and objects; individual furniture retains its measured orientation. A room is currently represented by an enclosing rectangle, so angled/L-shaped/curved walls are approximated. Raw wall polygons and open passageways are not exported.
- Zero-depth doors/windows get a 1 cm display thickness. RoomPlan labels map to the existing furniture catalog; unsupported furniture types use the generic model.
- Surface colors/materials are display defaults, not measurements. Labels are supplied by RoomPlan. Its qualitative confidence is not converted into a fabricated probability.
- UUID namespacing prevents collisions with demo object ids. The backend retains RoomPlan labels during reconstruction.
- One room, at most 500 objects, positive dimensions up to 50 m. The browser limits files to 5 MB and validates geometry before replacing the current scene.

## Validation on a Mac

```sh
xcodebuild -project ios/InteLiDarCapture.xcodeproj -scheme InteLiDarCapture \
  -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build

# Select an installed simulator for the exporter unit tests; a simulator cannot capture.
xcodebuild -project ios/InteLiDarCapture.xcodeproj -scheme InteLiDarCapture \
  -destination 'platform=iOS Simulator,id=<SIMULATOR-UDID>' test
```

`ScanExportTests` covers origin normalization, planar thickness, JSON object encoding, XYZ rotation round-trips, squaring the room up across every scan heading (including the no-op, the long-wall vote, and walls it cannot read), and millimetre rounding. On a real phone also verify unsupported-device gating, permission denial and recovery, that a notification banner or Control Center does **not** end a scan while backgrounding does, capture completion, failed/incomplete scans, new-scan confirmation, and export into Safari. Browser tests run in Chromium and WebKit with an iPhone profile and use a synthetic file with the same export contract; they are not proof of real sensor capture. Install browser test engines with `npx playwright install chromium webkit`.

Apple references: [RoomPlan](https://developer.apple.com/augmented-reality/roomplan/), [hardware support](https://developer.apple.com/documentation/roomplan/roomcapturesession/issupported), [capture view callbacks](https://developer.apple.com/documentation/roomplan/roomcaptureviewdelegate).
