import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Hud } from './Hud'
import { sampleGraph } from '../test/sampleGraph'
import { PRESETS } from '../settings/graphics'
import type { ComponentProps } from 'react'

function renderHud(overrides: Partial<ComponentProps<typeof Hud>> = {}) {
  const props: ComponentProps<typeof Hud> = {
    mode: 'raw',
    graph: sampleGraph,
    scanProgress: 1,
    query: '',
    reply: null,
    error: null,
    editing: false,
    highlightedIds: [],
    settings: PRESETS.high,
    analysisSteps: [
      { from: 'Unknown object', to: 'Table' },
      { from: 'Unknown opening', to: 'Door' },
    ],
    visibleStepCount: 1,
    onToggleEdit: vi.fn(),
    onQueryChange: vi.fn(),
    onAsk: vi.fn((event) => event.preventDefault()),
    onAskSuggestion: vi.fn(),
    onReconstruct: vi.fn(),
    onSkipScan: vi.fn(),
    onSelectObject: vi.fn(),
    onSettingsChange: vi.fn(),
    ...overrides,
  }
  return { user: userEvent.setup(), props, ...render(<Hud {...props} />) }
}

describe('Hud', () => {
  it('keeps reconstruct available and ask locked in the raw scan', () => {
    renderHud()
    expect(screen.getByRole('button', { name: /AI Reconstruct/ })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: /ask the spatial assistant/i })).toBeDisabled()
    expect(screen.getByText('Raw mesh')).toBeInTheDocument()
    expect(screen.getAllByText('unknown').length).toBeGreaterThan(0)
  })

  it('unlocks ask and hides reconstruct in the semantic twin', async () => {
    const { user, props } = renderHud({ mode: 'twin', query: 'Show me all the chairs.' })
    expect(screen.queryByRole('button', { name: /AI Reconstruct/ })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /ask the spatial assistant/i })).toBeEnabled()
    expect(screen.getByText('table')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show me all the chairs.' }))
    expect(props.onAskSuggestion).toHaveBeenCalledWith('Show me all the chairs.')
  })

  it('shows analysis steps while reconstructing and disables edit', () => {
    renderHud({ mode: 'analysing' })
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Table')
    expect(status).not.toHaveTextContent('Door')
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('turns on the furniture-drag affordance from the edit toggle', async () => {
    const { user, props, rerender } = renderHud()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(props.onToggleEdit).toHaveBeenCalledTimes(1)

    rerender(<Hud {...props} editing />)
    expect(screen.getByRole('button', { name: 'Editing' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/drag tables, chairs, and equipment/i)).toBeInTheDocument()
  })

  it('surfaces backend errors in the ask bar', () => {
    renderHud({ error: 'Backend unavailable. Start the API on port 8000.' })
    expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument()
  })

  it('reports sweep progress instead of the reconstruct CTA while capturing', () => {
    renderHud({ scanProgress: 0.02 })
    expect(screen.queryByRole('button', { name: /AI Reconstruct/ })).not.toBeInTheDocument()
    expect(screen.getByText('LiDAR capture')).toBeInTheDocument()

    const meter = screen.getByRole('progressbar', { name: /lidar capture/i })
    expect(meter).toHaveAttribute('aria-valuenow', '2')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })

  it('lists objects only once the sweep has found them', () => {
    const { rerender, props } = renderHud({ scanProgress: 0.02 })
    expect(screen.getByText('Conference table')).toBeInTheDocument()
    expect(screen.queryByText('Door')).not.toBeInTheDocument()

    rerender(<Hud {...props} scanProgress={1} />)
    expect(screen.getByText('Door')).toBeInTheDocument()
  })

  it('lets a presenter skip the opening sweep', async () => {
    const { user, props } = renderHud({ scanProgress: 0.3 })
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(props.onSkipScan).toHaveBeenCalledTimes(1)
  })

  it('holds edit closed until the sweep completes', () => {
    renderHud({ scanProgress: 0.3 })
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('does not pretend to scan when the backend never answered', () => {
    renderHud({ graph: null, scanProgress: 0, error: 'Backend unavailable. Start the API on port 8000.' })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI Reconstruct/ })).toBeDisabled()
    expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument()
  })

  it('offers the graphics menu in every mode, including mid-sweep', async () => {
    const { user, props } = renderHud({ scanProgress: 0.3 })
    const menu = screen.getByRole('button', { name: /graphics/i })
    expect(menu).toBeEnabled()

    await user.click(menu)
    await user.click(screen.getByRole('switch', { name: /point cloud/i }))
    expect(props.onSettingsChange).toHaveBeenCalledWith({ ...PRESETS.high, pointCloud: false })
  })

  it('marks the objects an answer highlighted', () => {
    renderHud({ mode: 'twin', highlightedIds: ['door-1'] })
    expect(screen.getByRole('button', { name: /Door/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Conference table/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('highlights an object picked from the scene list', async () => {
    const { user, props } = renderHud({ mode: 'twin' })
    await user.click(screen.getByRole('button', { name: /Conference table/ }))
    expect(props.onSelectObject).toHaveBeenCalledWith('table-1')
  })
})
