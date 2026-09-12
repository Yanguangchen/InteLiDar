import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Hud } from './Hud'
import { sampleGraph } from '../test/sampleGraph'
import type { ComponentProps } from 'react'

function renderHud(overrides: Partial<ComponentProps<typeof Hud>> = {}) {
  const props: ComponentProps<typeof Hud> = {
    mode: 'raw',
    graph: sampleGraph,
    query: '',
    reply: null,
    error: null,
    editing: false,
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
    expect(screen.getByRole('status')).toHaveTextContent('Table')
    expect(screen.queryByText('Door')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('turns on the furniture-drag affordance from the edit toggle', async () => {
    const { user, props } = renderHud()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(props.onToggleEdit).toHaveBeenCalledTimes(1)

    renderHud({ editing: true })
    expect(screen.getByRole('button', { name: 'Editing' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/drag tables, chairs, and equipment/i)).toBeInTheDocument()
  })

  it('surfaces backend errors in the ask bar', () => {
    renderHud({ error: 'Backend unavailable. Start the API on port 8000.' })
    expect(screen.getByText(/backend unavailable/i)).toBeInTheDocument()
  })
})
