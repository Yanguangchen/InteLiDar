import type { Group } from 'three'
import type { Vec3 } from '../scene/types'

export type RoomBounds = { min: Vec3; max: Vec3 }

export type RoomCollider =
  | { kind: 'box'; center: Vec3; halfExtents: Vec3; rotation?: Vec3 }
  | { kind: 'trimesh'; vertices: Float32Array; indices: Uint32Array }

/** Source-independent, meter-scaled input to gameplay; spawn is the feet position. */
export type RoomEnvironment = {
  id: string
  bounds: RoomBounds
  colliders: RoomCollider[]
  spawn: Vec3
}

export type LoadedRoom = {
  id: string
  name: string
  root: Group
  bounds: RoomBounds
  triangleCount: number
  dispose(): void
}

export type NormalizedRoom = {
  environment: RoomEnvironment
  /** Apply this translation and scale to a wrapper around the unchanged root. */
  position: Vec3
  scale: number
}
