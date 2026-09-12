import type { FormEvent } from 'react'
import type { AnalysisStep, SceneGraph, SceneMode } from '../scene/types'

type HudProps = {
  mode: SceneMode
  graph: SceneGraph | null
  query: string
  reply: string | null
  error: string | null
  editing: boolean
  analysisSteps: AnalysisStep[]
  visibleStepCount: number
  onToggleEdit: () => void
  onQueryChange: (value: string) => void
  onAsk: (event: FormEvent) => void
  onAskSuggestion: (value: string) => void
  onReconstruct: () => void
}

const SUGGESTIONS = [
  'Show me all the chairs.',
  'Where is the door?',
  'What objects could obstruct movement through this room?',
]

export function Hud({
  mode,
  graph,
  query,
  reply,
  error,
  editing,
  analysisSteps,
  visibleStepCount,
  onToggleEdit,
  onQueryChange,
  onAsk,
  onAskSuggestion,
  onReconstruct,
}: HudProps) {
  const reconstructed = mode === 'twin'
  const room = graph?.room
  const objects = graph?.objects ?? []

  return (
    <div className="hud">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="name">InteLiDar</p>
            <p className="tag">Scan reality. AI understands it.</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className={`edit-toggle ${editing ? 'on' : ''}`}
            aria-pressed={editing}
            disabled={!graph || mode === 'analysing'}
            onClick={onToggleEdit}
          >
            {editing ? 'Editing' : 'Edit'}
          </button>
          <div className={`status ${reconstructed ? 'status-twin' : 'status-raw'}`}>
            <span className="status-dot" />
            {mode === 'raw' && 'Raw mesh'}
            {mode === 'analysing' && 'Analysing scene'}
            {mode === 'twin' && 'Semantic twin'}
          </div>
        </div>
      </header>

      <aside className="panel panel-left">
        <p className="panel-kicker">Scene</p>
        <h2>{reconstructed ? room?.name ?? 'Meeting room' : 'Unlabelled scan'}</h2>
        {editing && (
          <p className="edit-hint">Drag tables, chairs, and equipment. Doors and windows stay fixed.</p>
        )}
        <dl className="meta">
          <div>
            <dt>Size</dt>
            <dd>
              {room ? `${room.width} × ${room.depth} × ${room.height} m` : '—'}
            </dd>
          </div>
          <div>
            <dt>Objects</dt>
            <dd>{reconstructed ? objects.length : '—'}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>LiDAR demo mesh</dd>
          </div>
        </dl>

        <ul className="object-list">
          {objects.map((object) => (
            <li key={object.id} className={reconstructed ? 'known' : 'unknown'}>
              <span className="obj-type">{reconstructed ? object.type : 'unknown'}</span>
              <span>{object.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {mode !== 'twin' && (
        <div className="reconstruct-wrap">
          {mode === 'analysing' ? (
            <div className="analysis" role="status">
              <p className="panel-kicker">Computer vision</p>
              <ol>
                {analysisSteps.slice(0, visibleStepCount).map((step) => (
                  <li key={`${step.from}-${step.to}`}>
                    <span>{step.from}</span>
                    <span className="arrow">→</span>
                    <strong>{step.to}</strong>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <button type="button" className="reconstruct" onClick={onReconstruct} disabled={!graph}>
              ✨ AI Reconstruct
            </button>
          )}
        </div>
      )}

      <form className="ask" onSubmit={onAsk}>
        <label htmlFor="ask-input">Ask the spatial assistant</label>
        <div className="ask-row">
          <input
            id="ask-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={reconstructed ? 'Show me all the chairs.' : 'Reconstruct the scene to ask questions'}
            disabled={!reconstructed}
            autoComplete="off"
          />
          <button type="submit" disabled={!reconstructed || query.trim().length === 0}>
            Ask
          </button>
        </div>
        {reconstructed && (
          <div className="suggestions">
            {SUGGESTIONS.map((item) => (
              <button key={item} type="button" onClick={() => onAskSuggestion(item)}>
                {item}
              </button>
            ))}
          </div>
        )}
        {reply && <p className="reply">{reply}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
