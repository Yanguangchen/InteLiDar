# Getting real LiDAR into InteLiDar

Three ways to put a real, measured room into the viewer, and what each one costs. Also, plainly, why the website cannot
simply ask the phone for its depth sensor.

| Route | Needs | You get | Setup |
| --- | --- | --- | --- |
| [Scanner app → GLB](#route-a-a-scanner-app-from-the-app-store) | LiDAR iPhone | Real room geometry, walkable | Minutes |
| [InteLiDar Capture](#route-b-intelidar-capture-the-native-app) | LiDAR iPhone, Mac, Xcode | Real room **with semantics** — labels, Ask, Edit, Renovate | An hour, then re-sign weekly on a free account |
| [Simulated floor](#route-c-no-device-at-all) | Nothing | A generated 106-object floor, whole pipeline | None |

## Why the website cannot read the LiDAR sensor

This comes up every time, so: **there is no web API for LiDAR on iOS.** Not one this project chose not to use — one
that does not exist.

| Web API | What it gives | Depth? |
| --- | --- | --- |
| `getUserMedia` / MediaDevices | RGB camera frames | **No.** iOS exposes no depth track |
| WebXR Device API | On Android Chrome, `depth-sensing` / `hit-test` / `plane-detection` via ARCore | **Not on iOS.** Safari ships no `immersive-ar` session on iPhone |
| Generic Sensor API | Accelerometer, gyroscope, magnetometer, ambient light | **No** |
| DeviceMotion / DeviceOrientation | Orientation and motion | **No** |

ARKit and RoomPlan are native frameworks behind app entitlements, and Apple has never bridged them to WebKit. That is
unlikely to change: a depth map of someone's home is among the most sensitive data a phone can produce — room
dimensions, layout, contents — and native apps only get it after an explicit camera permission prompt.

So the architecture is **native capture → file → web import**. That is not a shortcut around a missing feature; on
iPhone it is the only available shape.

Even on Android, where WebXR depth-sensing does exist, it yields a coarse per-frame depth map — not "this cluster is a
chair." The semantic labelling is the valuable part, and it is native-only.

## Route A: a scanner app from the App Store

**The fastest way to see your own room, and it needs no Mac.** Apps such as Scaniverse or Polycam use the same LiDAR
sensor and export `.glb`.

1. Scan your room with the scanner app.
2. Export as **GLB** — self-contained, under 50 MiB and 250,000 triangles ([playable rooms](./playable-rooms.md)).
3. In InteLiDar: **Import room** → choose units → click a clear floor spot → **Open room** → **Play**.

No Mac, no Xcode, no signing, no expiry.

**What this route does not give you.** A GLB is triangles. Nothing in it says "chair", so there are no object ids, and
therefore no **AI Reconstruct**, no **Ask** highlighting, no **Edit** or **Renovate**. You get the room, not the semantic
twin. Closing that gap means segmenting and classifying the mesh, which is the vision work in
[the roadmap](./roadmap.md).

## Route B: InteLiDar Capture, the native app

The full pipeline — RoomPlan hands over classified, labelled, oriented objects, so the scan opens as a semantic twin
with Ask, Edit, Renovate and Export all working on your actual room. Build and install instructions are in
[ios/README.md](../ios/README.md); the geometry it produces is documented in
[capture geometry](./capture-geometry.md).

### You do not stay tethered to Xcode — but a free account expires weekly

Once built and installed, the app runs standalone like any other app. No cable, no Mac, no Xcode running. **How long it
keeps working depends entirely on how it was signed**, and this is the detail most likely to ruin a demo:

| Signing | Cost | App keeps working for |
| --- | --- | --- |
| Free personal team (just an Apple ID) | Free | **7 days**, then it refuses to launch until you reconnect to the Mac and Run again |
| Paid Apple Developer Program | $99/year | About a year |
| TestFlight | $99/year | Testers install from the TestFlight app, no cable ever; builds expire after 90 days |
| App Store | $99/year | Public install, but full App Review first |

iOS refuses to run any app that is not cryptographically signed by a certificate the phone trusts, and Apple makes free
signing deliberately short-lived so it is not used as free distribution.

On a **free** account you will also, once, need to trust the certificate: **Settings → General → VPN & Device
Management → trust this developer.**

**If the app stops launching after about a week, nothing is broken.** Reconnect the phone, open the project, press Run,
and it is re-signed for another 7 days. Budget for this if your event runs longer than a week, or pay the $99 and forget
about it.

### This repository ships source, not an app

There is no signed IPA and no TestFlight build here, and the app has never been compiled or run on a device. Its logic
is tested — see [capture geometry](./capture-geometry.md) — but a Mac and Xcode are still required to turn it into
something installable.

## Route C: no device at all

**Import scan → Load simulated scan** opens a generated 18 × 11.6 m office floor with 106 objects and runs the entire
pipeline on it. Nothing in it was measured and every surface says so. See
[capture](./capture.md#no-iphone-use-the-simulated-floor).

## Device requirements

RoomPlan needs a **LiDAR scanner**, which Apple has only ever put in Pro-tier iPhones — iPhone 12 Pro / Pro Max and
later Pro models — plus iPad Pro from 2020. A non-Pro iPhone has no depth sensor, so Routes A and B are both
unavailable on one, whatever app is installed. The native app checks `RoomCaptureSession.isSupported` and disables
scanning with an explanation rather than failing at the camera.

Route C works on any device, including a laptop.

## Related

- [Capture](./capture.md) — the scan workflow and the simulated floor
- [Capture geometry](./capture-geometry.md) — how a scan becomes a scene graph
- [Playable rooms](./playable-rooms.md) — importing a GLB room and walking it
- [Export](./export.md) — getting a room back out
- [ios/README.md](../ios/README.md) — building and installing the native app
