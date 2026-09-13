import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomActions, PlayHud, ImportSetupHud } from './ExperienceHud'
import { PRESETS } from '../settings/graphics'

describe('desktop room controls', () => {
  it('offers local import even while the demo is unavailable, but gates Play', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    render(<RoomActions canPlay={false} loading={false} onPlay={vi.fn()} onImport={onImport} />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
    const file = new File(['room'], 'meeting-room.glb', { type: 'model/gltf-binary' })
    await user.upload(screen.getByLabelText('Import room file'), file)
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('shows desktop instructions and an explicit resume action without editing tools', async () => {
    const user = userEvent.setup()
    const onResume = vi.fn()
    const onExit = vi.fn()
    render(<PlayHud ready paused name="Meeting room" onResume={onResume} onExit={onExit}
      onReset={vi.fn()} settings={PRESETS.low} onSettingsChange={vi.fn()} />)
    expect(screen.getByText(/WASD/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    await user.click(screen.getByRole('button', { name: 'Exit play' }))
    expect(onResume).toHaveBeenCalledOnce()
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('requires a validated floor point and resets units through the setup interface', async () => {
    const user = userEvent.setup()
    const onScale = vi.fn()
    const props = { name: 'room.glb', dimensions: [5, 3, 4] as [number, number, number], scale: 1,
      validating: false, valid: false, message: null, onScale, onCommit: vi.fn(), onCancel: vi.fn(),
      settings: PRESETS.low, onSettingsChange: vi.fn() }
    const { rerender } = render(<ImportSetupHud {...props} />)
    expect(screen.getByRole('button', { name: 'Open room' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Model units'), '0.01')
    expect(onScale).toHaveBeenCalledWith(0.01)
    rerender(<ImportSetupHud {...props} valid />)
    expect(screen.getByRole('button', { name: 'Open room' })).toBeEnabled()
  })
})
