import { describe, expect, it, vi } from 'vitest'
import { bindDesktopInput, movementAnimation, movementVelocity } from './controls'

describe('desktop player controls', () => {
  it('moves at the same speed diagonally, relative to camera yaw', () => {
    const forward = movementVelocity({ x: 0, z: -1, run: false }, 0)
    const diagonal = movementVelocity({ x: 1, z: -1, run: false }, 0)
    expect(forward).toEqual([0, -1.6])
    expect(Math.hypot(...diagonal)).toBeCloseTo(1.6)
    const rotated = movementVelocity({ x: 0, z: -1, run: true }, Math.PI / 2)
    expect(rotated[0]).toBeCloseTo(-3.2)
    expect(rotated[1]).toBeCloseTo(0)
  })

  it('chooses animation from actual movement rather than pressed keys', () => {
    expect(movementAnimation(0, 1 / 60, true)).toBe('idle')
    expect(movementAnimation(1.6 / 60, 1 / 60, false)).toBe('walk')
    expect(movementAnimation(3.2 / 60, 1 / 60, true)).toBe('run')
  })

  it('clears keys on blur, ignores forms, and cannot retain paused input', () => {
    const canvas = document.createElement('canvas')
    const input = document.createElement('input')
    document.body.append(canvas, input)
    let enabled = true
    const controls = bindDesktopInput(canvas, () => enabled, vi.fn())
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))
    expect(controls.read().z).toBe(-1)
    window.dispatchEvent(new Event('blur'))
    expect(controls.read().z).toBe(0)
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))
    expect(controls.read().z).toBe(0)
    enabled = false
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))
    enabled = true
    expect(controls.read().z).toBe(0)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    expect(controls.read().x).toBe(1)
    controls.dispose()
    expect(controls.read().x).toBe(0)
    canvas.remove()
    input.remove()
  })

  it('looks only during a mouse drag and clears movement when the pointer is cancelled', () => {
    const canvas = document.createElement('canvas')
    const look = vi.fn()
    const controls = bindDesktopInput(canvas, () => true, look)
    const pointer = (type: string, x: number, y: number, pointerType = 'mouse') => {
      const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0 })
      Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: pointerType } })
      canvas.dispatchEvent(event)
    }
    pointer('pointermove', 10, 10)
    expect(look).not.toHaveBeenCalled()
    pointer('pointerdown', 10, 10)
    pointer('pointermove', 30, 15)
    expect(look).toHaveBeenLastCalledWith(20, 5)
    pointer('pointerup', 30, 15)
    pointer('pointermove', 40, 20)
    expect(look).toHaveBeenCalledTimes(1)
    pointer('pointerdown', 10, 10, 'touch')
    pointer('pointermove', 30, 15, 'touch')
    expect(look).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))
    canvas.dispatchEvent(new Event('pointercancel'))
    expect(controls.read().z).toBe(0)
    controls.dispose()
  })
})
