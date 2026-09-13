# InteliDar Indoor Essentials

The library now also includes **12 photo café props** (42 GLBs total). See the [photo demo guide](../docs/photo-demo.md) for the layout, reused assets, chess models, and reproducible generator. The original-library counts and validation reports below cover the original 30 assets.

30 original, lightweight Blender assets for LiDAR room environments and Three.js. All 30 GLBs are self-contained: no textures, external buffers, branding, or decoder dependencies.

- **GLB total:** 34,960 triangles; approximately 2.28 MiB. Exact byte counts are in the validation reports.
- **Source:** [intelidar_asset_library.blend](intelidar_asset_library.blend), with all asset collections marked for the Blender Asset Browser and a separate display gallery.
- **Scale:** metres, 1 unit = 1 metre. Exports use +Y up and +Z forward; source uses +Z up and -Y forward.
- **Origins:** floor/support-surface centre, except the door at its bottom-left hinge. Electronics are placed at their support surface, so a monitor's position.y should equal desktop height.
- **Geometry:** one joined static mesh per prop. Three.js splits material primitives into multiple meshes/draw calls. Each avatar has one authored mesh, eight material primitives, and one 21-bone skeleton.
- **Materials:** solid-color Principled/PBR metallic-roughness; UVMap included; no Blender-only shader nodes or texture downloads.
- **Transforms:** object scale/rotation applied; only necessary avatar armature deformation remains. No subdivision or geometry-generation modifiers in final objects.

## Catalog

Dimensions are **width × depth × height** in metres. Triangle counts are exact counts from the GLB, not untriangulated face counts. Preview category sheets normalize display sizes for legibility; exported scales remain real-world.

| Asset / GLB | Triangles | Dimensions (m) | KiB |
| --- | ---: | --- | ---: |
| [chair_standard](furniture/chair_standard.glb) | 480 | 0.460 × 0.460 × 0.880 | 37.4 |
| [chair_office](furniture/chair_office.glb) | 1,168 | 0.645 × 0.585 × 0.970 | 71.6 |
| [stool_round](furniture/stool_round.glb) | 348 | 0.370 × 0.370 × 0.446 | 18.5 |
| [table_dining](furniture/table_dining.glb) | 372 | 1.400 × 0.800 × 0.750 | 29.1 |
| [table_side](furniture/table_side.glb) | 284 | 0.450 × 0.450 × 0.500 | 22.6 |
| [cabinet_simple](furniture/cabinet_simple.glb) | 616 | 0.940 × 0.463 × 0.900 | 48.7 |
| [shelf_open](furniture/shelf_open.glb) | 380 | 0.800 × 0.380 × 1.800 | 29.4 |
| [desk_small](furniture/desk_small.glb) | 504 | 1.100 × 0.560 × 0.750 | 39.8 |
| [plant_potted_small](plants/plant_potted_small.glb) | 592 | 0.210 × 0.210 × 0.402 | 35.2 |
| [plant_potted_medium](plants/plant_potted_medium.glb) | 760 | 0.375 × 0.340 × 0.863 | 46.9 |
| [plant_indoor_tall](plants/plant_indoor_tall.glb) | 900 | 0.852 × 0.753 × 1.740 | 56.3 |
| [pot_empty](plants/pot_empty.glb) | 236 | 0.300 × 0.300 × 0.240 | 9.7 |
| [sofa_2seat](furniture/sofa_2seat.glb) | 1,600 | 1.620 × 0.860 × 0.860 | 115.3 |
| [sofa_3seat](furniture/sofa_3seat.glb) | 1,976 | 2.180 × 0.860 × 0.860 | 141.5 |
| [bed_single](furniture/bed_single.glb) | 984 | 1.000 × 2.090 × 0.900 | 72.6 |
| [bed_double](furniture/bed_double.glb) | 1,172 | 1.600 × 2.090 × 0.900 | 86.9 |
| [tv_flat](electronics/tv_flat.glb) | 332 | 1.100 × 0.310 × 0.808 | 23.7 |
| [monitor_desktop](electronics/monitor_desktop.glb) | 332 | 0.580 × 0.200 × 0.478 | 23.7 |
| [computer_desktop](electronics/computer_desktop.glb) | 492 | 0.200 × 0.381 × 0.413 | 37.9 |
| [keyboard](electronics/keyboard.glb) | 2,440 | 0.430 × 0.140 × 0.024 | 182.3 |
| [laptop](electronics/laptop.glb) | 2,284 | 0.340 × 0.262 × 0.229 | 169.8 |
| [lamp_floor](furniture/lamp_floor.glb) | 496 | 0.450 × 0.450 × 1.600 | 25.0 |
| [table_coffee](furniture/table_coffee.glb) | 284 | 1.000 × 0.550 × 0.400 | 22.6 |
| [trash_bin](furniture/trash_bin.glb) | 236 | 0.280 × 0.280 × 0.320 | 9.7 |
| [bookshelf](furniture/bookshelf.glb) | 908 | 0.800 × 0.380 × 1.800 | 70.9 |
| [door_simple](furniture/door_simple.glb) | 396 | 0.901 × 0.112 × 2.040 | 21.5 |
| [rug_simple](furniture/rug_simple.glb) | 132 | 1.600 × 2.200 × 0.009 | 11.2 |
| [avatar_casual](avatars/avatar_casual.glb) | 4,860 | 0.754 × 0.334 × 1.779 | 328.8 |
| [avatar_sporty](avatars/avatar_sporty.glb) | 4,936 | 0.762 × 0.337 × 1.778 | 286.5 |
| [avatar_stylized](avatars/avatar_stylized.glb) | 4,460 | 0.716 × 0.317 × 1.689 | 263.6 |

## Avatars and animation

All three avatars (`avatar_casual`, `avatar_sporty`, `avatar_stylized`) are rigged and include looping, in-place `idle` (3 seconds), `walk` (1.2 seconds), and `run` (0.8 seconds) clips at 30 fps. These are simple procedural FK loops; the game controller supplies movement. The walk cycle includes baked floor-contact corrections.

`avatar_casual` additionally includes one-shot `sit_down` and `stand_up` clips (20 frames / 30 fps, approximately 0.667 seconds) and looping `seated_idle` (3 seconds). The object root stays at the floor with no horizontal root motion. At the reference seat surface of **0.46 m**, the seated hips joint is **0.55405 m** high; its vertical displacement from standing is **−0.38645 m**. Knees face +Z and the flat soles remain on the floor. Place the visual root at `seatSurfaceY - 0.46` for other seat heights; keep the standing avatar's scale unchanged. Custom root metadata records these values for validation. The casual NLA tracks use frames 241–261, 301–391, and 421–441 for these three actions.

The sit/stand transitions bake a two-link leg solve so shoes stay on the floor while the hips move. Gameplay additionally uses `createSeatPose` from `src/player/seatPose.ts` after the mixer step to calibrate cushion heights from **0.36–0.64 m above the floor**. It preserves the animated forward foot positions, adjusts knee flexion, and keeps both soles flat without scaling the avatar or altering the upper body. Construct it on the unposed clone; pass the same seating weight used to blend the visual root height.

The common 21-bone hierarchy contains hips, spine, chest, neck, head, paired shoulders, upper arms, forearms, hands, thighs, shins, feet, and toes. `.L`/`.R` denote sides. This is a generic named humanoid rig, not a VRM avatar or a Mixamo-specific retargeting profile. Rest pose is relaxed arms-down; import both skin and armature together.

In the Blender source, NLA tracks occupy idle frames 1–91, walk 121–157, and run 181–205. Each exported clip is shifted to zero start. Export selected avatar objects with animations/skins enabled, `NLA_TRACKS`, `export_anim_slide_to_zero=True`, and `export_frame_range=False`. Export the active scene only so the gallery is excluded.

## Three.js placement

Standard demo shapes use the bundled GLBs. Alternate shapes from Appearance use procedural geometry; placed renovation assets retain their catalog models. Color and finish edits apply to the selected model, and gameplay uses the edited graph's dimensions and rotations for collision bounds.

The reconstructed demo now loads the chair, table, shelf, and monitor through the [asset catalog](../src/assets/catalog.ts); desktop Play uses `avatar_casual`. Vite bundles those GLB URLs for development and production. Paths in [manifest.json](manifest.json) are relative to `models/`. See [desktop rooms](../docs/playable-rooms.md) for controls and import setup.

The viewer's **Renovate** library loads 26 furniture, plant, and electronics GLBs from this directory using [manifest.json](manifest.json). Vite bundles their URLs automatically; no manual copying is required. The structural door and skinned avatars are excluded from the renovation catalog. Paths in the manifest are relative to `models/`. See the [renovation guide](../docs/renovation.md).

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import { avatarCasualUrl } from '../src/assets/catalog';

const gltf = await new GLTFLoader().loadAsync(avatarCasualUrl);
scene.add(gltf.scene);
gltf.scene.position.set(x, floorY, z); // metres, floor origin
const mixer = new AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations.find(clip => clip.name === 'idle')).play();
// In the render loop: mixer.update(deltaSeconds).
```

For repeated skinned avatars, clone with `SkeletonUtils.clone`, not a plain `Object3D.clone`. Preserve the LiDAR scene graph ID on an outer placement group. The repo stores object positions at box centres: convert floor position with `graphObject.position[1] - graphObject.size[1] / 2` when appropriate. The door's hinge origin needs separate placement. Prefer uniform scaling; the measured dimensions in the manifest are available for asset matching.

The GLBs include no collision shapes or gameplay scripts. Derive collision primitives from the scene graph or manifest dimensions. The TV includes a pedestal; the door is a closed slab with a hinge origin, without its own frame or animation. Keyboard/laptop keys are deliberately unlabelled.

## Verification

- All 30 GLBs passed binary checks for embedded buffers, indices, finite positions/normals/UVs, PBR materials, origins, skinning, and animations.
- All 30 were imported individually into temporary clean Blender scenes; triangle counts, materials, dimensions, normals, UVs, and armatures were verified with no warnings. Blender's generated bone-display helpers are excluded from geometry counts.
- The repo's actual Three.js r186 `GLTFLoader` loaded all 30; all twelve avatar clips were sampled and checked for finite bone matrices and posed bounds. This is loader/animation validation, not a WebGL pixel regression test.
- Blender-rendered previews were visually reviewed for all assets, plus idle/walk/run poses.

Reports: [validation.json](validation.json), [validation_three.json](validation_three.json), [manifest.json](manifest.json).

## Previews

[Full library](previews/00_asset_library.png) · [Furniture](previews/01_furniture.png) · [Sofas and beds](previews/02_living.png) · [Plants](previews/03_plants.png) · [Electronics](previews/04_electronics.png) · [Avatars](previews/05_avatars.png) · [Extras](previews/06_extras.png) · [Animation poses](previews/07_animation_poses.png)

## Rebuild and recheck

The deterministic generators in `source/` build original native Blender geometry, apply geometry modifiers, unwrap UVs, create the shared rigs, and export GLBs. Rebuild into a **new output directory** to preserve the delivered library:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python models/source/build_pack.py -- --output E:/Projects/InteLiDar/models-rebuilt
& 'C:\Program Files\Blender Foundation\Blender 5.2\5.2\python\bin\python.exe' models/source/validate_assets.py models
node models/source/validate_three.mjs
```

Running the standalone binary validator overwrites `validation.json` without Blender roundtrip sections. To generate the full report, run its `--blender-roundtrip` option inside Blender. Asset creation uses no third-party meshes, images, fonts baked into GLBs, or external material assets.

To rebuild only the casual gameplay avatar, including its sitting actions, run the targeted generator below. It preserves other GLBs and the existing library `.blend`; that gallery snapshot predates the sitting actions, while `build_avatars.py` is the current reproducible source. The optional preview renders the seated pose at the reference seat height into ignored test output.

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python models/source/export_casual_avatar.py -- --preview test-results/avatar-seated.png
node --test scripts/avatarAnimations.test.mjs
```
