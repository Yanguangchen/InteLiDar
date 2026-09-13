# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

InteliDar is a hackathon project that turns a scanned indoor room into a playable 3D environment. The longer-term pipeline is room capture, structural geometry, AI-assisted surface appearance, and a third-person character.

## Operating Context

The current milestone runs in a desktop browser with keyboard and mouse. It supports a synthetic meeting-room demonstration and local, saved GLB rooms. iPhone capture and mobile gameplay are deferred. A standard iPhone 16 is not a LiDAR capture device.

## Capabilities and Constraints

- Reuse the existing Blender furniture and casual avatar assets, with realistic meter scale.
- Preserve the demo's scan visualization, reconstruction, spatial questions, and furniture editing.
- Offer a separate Play mode with walking, running, camera follow, and static room collisions.
- Import static, self-contained GLB rooms locally, with unit and starting-floor setup. Imported models remain in memory for the session; no scan upload or cloud persistence is added.
- Keep gameplay independent of the capture source. Imported meshes do not automatically gain semantic object labels, furniture replacement, geometry repair, or AI textures.

## Evidence on Hand

The repository contains a synthetic room fixture, scene graph APIs, a Three.js viewer, and an original Blender asset library with rigged avatars. The demo scan is a visualization over fixture data, not a live sensor measurement.

## Brand Commitments

Retain the InteLiDar name and the existing dark viewer with restrained teal accents and floating glass controls. The 3D room remains the primary content; Play mode reduces interface clutter.

## Product Principles

- Preserve measured dimensions and make setup assumptions visible.
- Keep source geometry, semantic information, and gameplay separate.
- Keep the previous usable room available while another import is being prepared.
- Validate features through the existing test-first workflow and real browser interactions.
