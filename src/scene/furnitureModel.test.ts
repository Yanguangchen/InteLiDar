import { describe, expect, it } from 'vitest'
import { Box3, DataTexture, Vector3 } from 'three'
import { buildFurnitureModel } from './buildFurnitureModel'
import { SHAPES } from './appearance'
import { updateAppearance, moveObject } from './editScene'
import { sampleGraph } from '../test/sampleGraph'
import type { SceneObject } from './types'

describe('detailed furniture', () => {
  for (const [type, shapes] of Object.entries(SHAPES)) for (const shape of shapes) {
    it(`${type}/${shape} retains the measured bounding volume`, () => {
      const object: SceneObject = { id: 'test', type, shape, label: type, category: 'furniture', position: [0, 0, 0], size: [2, 1, 0.7], color: '#b96348' }
      const model = buildFurnitureModel(object)
      const bounds = new Box3().setFromObject(model.root)
      const size = bounds.getSize(new Vector3())
      expect(model.root.children[0].children.length).toBeGreaterThan(3)
      for (let axis = 0; axis < 3; axis++) {
        expect(size.getComponent(axis)).toBeLessThanOrEqual(object.size[axis] + 0.005)
        expect(bounds.min.getComponent(axis)).toBeGreaterThanOrEqual(-object.size[axis] / 2 - 0.005)
        expect(bounds.max.getComponent(axis)).toBeLessThanOrEqual(object.size[axis] / 2 + 0.005)
      }
      expect(model.materials[0].color.getHexString()).toBe('b96348')
      expect((model.materials[0].map as DataTexture).image.data?.length).toBe(128 * 128 * 4)
      model.dispose()
    })
  }

  it('orients a shelf along its long wall axis', () => {
    const model = buildFurnitureModel({ ...sampleGraph.objects[0], type: 'shelf', size: [0.38, 1.8, 1.6] })
    const size = new Box3().setFromObject(model.root).getSize(new Vector3())
    expect(size.x).toBeCloseTo(0.38)
    expect(size.z).toBeCloseTo(1.6)
    model.dispose()
  })

  it('changes one appearance without changing measured geometry or other objects', () => {
    const next = updateAppearance(sampleGraph, 'table-1', { color: '#467568', material: 'stone', shape: 'oval' })
    expect(next.objects[0]).toMatchObject({ color: '#467568', material: 'stone', shape: 'oval' })
    expect(next.objects[0].size).toBe(sampleGraph.objects[0].size)
    expect(next.objects[0].position).toBe(sampleGraph.objects[0].position)
    expect(next.objects[1]).toBe(sampleGraph.objects[1])
    expect(moveObject(next, 'table-1', [1, 0, 1]).objects[0].shape).toBe('oval')
  })

  it('rejects invalid colors, unsupported finishes, and shapes from another model', () => {
    expect(updateAppearance(sampleGraph, 'table-1', { color: 'bad', material: 'missing', shape: 'armchair' })).toBe(sampleGraph)
  })

  it('keeps a rotated table inside the room when dragged against a wall', () => {
    const graph = { ...sampleGraph, objects: [{ ...sampleGraph.objects[0], rotation: [0, Math.PI / 2, 0] as [number, number, number] }] }
    const moved = moveObject(graph, 'table-1', [100, 0, 100]).objects[0]
    expect(moved.position[0]).toBeCloseTo(sampleGraph.room.width / 2 - 0.6)
    expect(moved.position[2]).toBeCloseTo(sampleGraph.room.depth / 2 - 1.2)
  })
})
