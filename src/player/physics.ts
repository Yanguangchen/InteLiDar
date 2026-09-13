import RAPIER from '@dimforge/rapier3d-compat'
import { Euler, Quaternion } from 'three'
import type { RoomEnvironment } from '../room/types'
import type { Vec3 } from '../scene/types'
import { movementAnimation, movementVelocity, type PlayerAnimation, type PlayerInput } from './controls'

export const PHYSICS_STEP = 1 / 60
export const PLAYER_HEIGHT = 1.8
export const PLAYER_RADIUS = 0.22
let initialized: Promise<void> | undefined
export function initializePhysics() { return initialized ??= RAPIER.init() }
const HALF_HEIGHT = PLAYER_HEIGHT / 2
const CAPSULE_HALF_SEGMENT = HALF_HEIGHT - PLAYER_RADIUS
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 }
const vector = ([x, y, z]: Vec3) => ({ x, y, z })
const SPAWN_MESSAGE = 'Choose a clear floor point with enough room for the character to stand.'

function attachEnvironment(world: RAPIER.World, environment: RoomEnvironment) {
  const colliders: RAPIER.Collider[] = []
  try {
    for (const shape of environment.colliders) {
      let description: RAPIER.ColliderDesc
      if (shape.kind === 'box') {
        description = RAPIER.ColliderDesc.cuboid(...shape.halfExtents).setTranslation(...shape.center)
        if (shape.rotation) description.setRotation(new Quaternion().setFromEuler(new Euler(...shape.rotation)))
      } else {
        description = RAPIER.ColliderDesc.trimesh(shape.vertices, shape.indices, RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES)
      }
      colliders.push(world.createCollider(description))
    }
    // Rapier updates its scene-query acceleration structure during a step.
    world.timestep = PHYSICS_STEP
    world.step()
    return colliders
  } catch (error) {
    colliders.forEach((collider) => world.removeCollider(collider, false))
    throw error
  }
}

function supportedSpawn(world: RAPIER.World, candidate: Vec3): Vec3 | null {
  const origin = { x: candidate[0], y: candidate[1] + 0.1, z: candidate[2] }
  const hit = world.castRayAndGetNormal(new RAPIER.Ray(origin, { x: 0, y: -1, z: 0 }), 0.35, false)
  if (!hit || hit.normal.y < Math.cos(Math.PI / 4)) return null
  const feet: Vec3 = [candidate[0], origin.y - hit.timeOfImpact + 0.015, candidate[2]]
  let blocked = false
  world.intersectionsWithShape(
    { x: feet[0], y: feet[1] + HALF_HEIGHT, z: feet[2] }, IDENTITY,
    new RAPIER.Capsule(CAPSULE_HALF_SEGMENT, PLAYER_RADIUS),
    () => { blocked = true; return false },
  )
  return blocked ? null : feet
}

function chooseSpawn(world: RAPIER.World, environment: RoomEnvironment, allowSearch: boolean): Vec3 | null {
  const preferred = supportedSpawn(world, environment.spawn)
  if (preferred || !allowSearch) return preferred
  const candidates: Vec3[] = []
  const { min, max } = environment.bounds
  for (let x = min[0] + 0.35; x <= max[0] - 0.35; x += 0.45) {
    for (let z = min[2] + 0.35; z <= max[2] - 0.35; z += 0.45) candidates.push([x, environment.spawn[1], z])
  }
  candidates.sort((a, b) => Math.hypot(a[0] - environment.spawn[0], a[2] - environment.spawn[2])
    - Math.hypot(b[0] - environment.spawn[0], b[2] - environment.spawn[2]))
  for (const candidate of candidates) {
    const spawn = supportedSpawn(world, candidate)
    if (spawn) return spawn
  }
  return null
}

/** Runs the same capsule/floor queries as gameplay, without mounting a canvas. */
export async function validateEnvironmentSpawn(environment: RoomEnvironment): Promise<{ valid: boolean; message?: string }> {
  await initializePhysics()
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  try {
    attachEnvironment(world, environment)
    return chooseSpawn(world, environment, false) ? { valid: true } : { valid: false, message: SPAWN_MESSAGE }
  } catch {
    return { valid: false, message: 'This room could not be prepared for collisions. Try another GLB.' }
  } finally { world.free() }
}

/** Owns only its room and character bodies; callers advance the shared world at 60 Hz. */
export function createPlayerSession(world: RAPIER.World, environment: RoomEnvironment, allowSpawnSearch = false) {
  const environmentColliders = attachEnvironment(world, environment)
  const spawn = chooseSpawn(world, environment, allowSpawnSearch)
  if (!spawn) {
    environmentColliders.forEach((collider) => world.removeCollider(collider, false))
    throw new Error(SPAWN_MESSAGE)
  }
  const center = { x: spawn[0], y: spawn[1] + HALF_HEIGHT, z: spawn[2] }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(center.x, center.y, center.z))
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(CAPSULE_HALF_SEGMENT, PLAYER_RADIUS), body)
  const controller = world.createCharacterController(0.01)
  controller.setSlideEnabled(true)
  controller.enableSnapToGround(0.12)
  controller.setMaxSlopeClimbAngle(Math.PI / 4)
  controller.setMinSlopeSlideAngle(Math.PI / 4)
  controller.disableAutostep()
  world.step()
  let verticalSpeed = 0
  let grounded = false
  let animation: PlayerAnimation = 'idle'
  let heading = Math.PI
  const feet = (): Vec3 => {
    const position = body.translation()
    return [position.x, position.y - HALF_HEIGHT, position.z]
  }
  const reset = () => {
    body.setTranslation(center, true)
    body.setNextKinematicTranslation(center)
    world.propagateModifiedBodyPositionsToColliders()
    verticalSpeed = 0
    grounded = false
    animation = 'idle'
  }
  return {
    feet, reset,
    grounded: () => grounded,
    animation: () => animation,
    heading: () => heading,
    setHeading: (next: number) => { heading = next },
    beforeStep: (input: PlayerInput, yaw: number) => {
      if (feet()[1] < environment.bounds.min[1] - 2) { reset(); return }
      const [vx, vz] = movementVelocity(input, yaw)
      verticalSpeed = grounded ? -0.5 : Math.max(-20, verticalSpeed - 9.81 * PHYSICS_STEP)
      controller.computeColliderMovement(collider, { x: vx * PHYSICS_STEP, y: verticalSpeed * PHYSICS_STEP, z: vz * PHYSICS_STEP })
      const movement = controller.computedMovement()
      const position = body.translation()
      body.setNextKinematicTranslation({ x: position.x + movement.x, y: position.y + movement.y, z: position.z + movement.z })
      grounded = controller.computedGrounded()
      animation = movementAnimation(Math.hypot(movement.x, movement.z), PHYSICS_STEP, input.run)
      if (animation !== 'idle') heading = Math.atan2(movement.x, movement.z)
    },
    cameraDistance: (target: Vec3, direction: Vec3, maximum: number) => {
      const hit = world.castShape(vector(target), IDENTITY, vector(direction), new RAPIER.Ball(0.14), 0, maximum, true,
        undefined, undefined, collider, body)
      return hit ? Math.max(0.02, hit.time_of_impact - 0.04) : maximum
    },
    dispose: () => {
      world.removeCharacterController(controller)
      world.removeRigidBody(body)
      environmentColliders.forEach((environmentCollider) => world.removeCollider(environmentCollider, false))
    },
  }
}
