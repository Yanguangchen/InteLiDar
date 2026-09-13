# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

InteliDar is a hackathon project that turns a scanned indoor room into a playable 3D environment. Users can inspect and renovate a semantic room, then explore with a third-person character, sit on furniture, and toggle lamps and screens. The longer-term pipeline includes richer structural geometry and AI-assisted surface appearance.

## Operating Context

Gameplay runs in a desktop browser with keyboard and mouse. It supports the synthetic meeting-room demonstration, imported RoomPlan scenes, and local saved GLB rooms. Mobile browsers support viewing, scan import, and editing. Native iPhone RoomPlan capture source is included but still requires an Xcode build and device verification. Mobile gameplay is deferred; capture requires a LiDAR-equipped iPhone.

## Capabilities and Constraints

- Reuse the existing Blender furniture and casual avatar assets, with realistic meter scale.
- Preserve the demo's scan visualization, reconstruction, spatial questions, and furniture editing.
- Offer a separate Play mode with walking, running, camera follow, and static room collisions.
- Support contextual sitting on chairs, stools, and individual sofa cushions, with safe access checks and seated camera control. Floor lamps and screens toggle independently in the demo, RoomPlan scenes, and renovation furniture.
- Keep furniture interaction state for the current semantic room session, including leaving and re-entering Play. Room replacement, refresh, and object removal clear relevant state; undo restores default toggle state.
- Import labeled `.intelidar.json` RoomPlan scans locally for viewing, editing, renovation, and desktop gameplay. Spatial questions send the semantic graph to the configured API and reasoner.
- Import static, self-contained GLB rooms locally, with unit and starting-floor setup. Imported models remain in memory for the session; no scan upload or cloud persistence is added.
- Keep gameplay independent of the capture source. Imported meshes do not automatically gain semantic object labels, furniture replacement, geometry repair, or AI textures.

## Evidence on Hand

The repository contains a synthetic room fixture, scene graph APIs, a Three.js viewer, an original Blender asset library with rigged avatars, and native RoomPlan capture/export source. Browser import tests use synthetic exports; they do not verify real iPhone sensor capture. The demo scan is a visualization over fixture data, not a live sensor measurement.

## Brand Commitments

Retain the InteLiDar name and the existing dark viewer with restrained teal accents and floating glass controls. The 3D room remains the primary content; Play mode reduces interface clutter.

## Product Principles

- Preserve measured dimensions and make setup assumptions visible.
- Keep source geometry, semantic information, and gameplay separate.
- Keep the previous usable room available while another import is being prepared.
- Validate features through the existing test-first workflow and real browser interactions.
