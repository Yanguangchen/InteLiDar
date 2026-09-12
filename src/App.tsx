import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { askScene, ingestScene, reconstructScene } from './api/scene'
import { Hud } from './components/Hud'
import { AppearanceEditor } from './components/AppearanceEditor'
import { RenovationPanel } from './components/RenovationPanel'
import { addFurniture, removeFurniture, rotateFurniture, undoRenovation, type RenovationResult, type RenovationUndo } from './scene/renovation'
import { moveObject, updateAppearance } from './scene/editScene'
import { useScanProgress } from './scene/useScanProgress'
import { ViewerScene } from './scene/ViewerScene'
import { SCAN_DURATION_MS } from './scene/scanReveal'
import { dprFor } from './settings/graphics'
import { useGraphics } from './settings/useGraphics'
import type { AnalysisStep, SceneGraph, SceneMode, Vec3 } from './scene/types'

export default function App() {
  const [mode, setMode] = useState<SceneMode>('raw')
  const [graph, setGraph] = useState<SceneGraph | null>(null)
  const [twinGraph, setTwinGraph] = useState<SceneGraph | null>(null)
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([])
  const [visibleStepCount, setVisibleStepCount] = useState(0)
  const [query, setQuery] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [renovating, setRenovating] = useState(false)
  const [renovationHistory, setRenovationHistory] = useState<RenovationUndo[]>([])
  const [renovationMessage, setRenovationMessage] = useState<string | null>(null)
  const imported = useRef(false)
  const sceneVersion = useRef(0)

  const [settings, setSettings] = useGraphics()

  const displayGraph = mode === 'twin' && twinGraph ? twinGraph : graph
  const importedCapture = displayGraph?.source === 'roomplan'
  // The sweep only starts once there is geometry for the sensor to find, and a
  // duration of 0 hands over a finished scan when animation is switched off.
  const { progress: scanProgress, skip: skipScan } = useScanProgress(
    graph !== null,
    settings.motion && !importedCapture ? SCAN_DURATION_MS : 0,
  )
  const scanning = mode === 'raw' && graph !== null && scanProgress < 1

  useEffect(() => {
    let cancelled = false
    ingestScene()
      .then((scene) => {
        if (cancelled || imported.current) return
        setGraph(scene)
        setError(null)
      })
      .catch(() => {
        if (cancelled || imported.current) return
        setError('Backend unavailable. Start the API on port 8000.')
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (mode !== 'analysing' || analysisSteps.length === 0) return

    setVisibleStepCount(0)
    let completionTimer: number | undefined
    const timers = analysisSteps.map((_, index) =>
      window.setTimeout(() => {
        setVisibleStepCount(index + 1)
        if (index === analysisSteps.length - 1) {
          completionTimer = window.setTimeout(() => setMode('twin'), 700)
        }
      }, 380 * (index + 1)),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(completionTimer)
    }
  }, [mode, analysisSteps])

  useEffect(() => {
    if (mode === 'analysing' || scanning || !editing) {
      setDragging(false)
      document.body.style.cursor = 'auto'
    }
    if (mode === 'analysing' || scanning) setEditing(false)
  }, [mode, editing, scanning])

  function onMoveObject(id: string, position: Vec3) {
    if (mode === 'twin') {
      setTwinGraph((current) => (current ? moveObject(current, id, position) : current))
      return
    }
    setGraph((current) => (current ? moveObject(current, id, position) : current))
  }

  function onSelectObject(id: string) {
    setHighlightedIds((current) =>
      current.length === 1 && current[0] === id ? [] : [id],
    )
  }

  function onImportCapture(scene: SceneGraph) {
    sceneVersion.current += 1
    imported.current = true
    setGraph(scene)
    setTwinGraph(scene)
    setMode('twin')
    setAnalysisSteps([])
    setReply(null)
    setQuery('')
    setHighlightedIds([])
    setEditing(false)
    setRenovating(false)
    setRenovationHistory([])
    setRenovationMessage(null)
    setDragging(false)
    setError(null)
    skipScan()
  }

  function applyRenovation(change: () => RenovationResult) {
    try {
      const result = change()
      sceneVersion.current += 1
      setTwinGraph(result.graph)
      setRenovationHistory((history) => [...history, result.undo].slice(-30))
      setHighlightedIds(result.selectedId ? [result.selectedId] : [])
      setReply(null)
      setDragging(false)
      setRenovationMessage(result.undo.kind === 'add' ? 'Furniture added. Drag it to adjust its position.' : 'Furniture removed. Undo is available.')
    } catch (cause) { setRenovationMessage(cause instanceof Error ? cause.message : 'Could not update this layout.') }
  }

  function onUndoRenovation() {
    const action = renovationHistory.at(-1)
    if (!twinGraph || !action) return
    sceneVersion.current += 1
    setTwinGraph(undoRenovation(twinGraph, action))
    setRenovationHistory((history) => history.slice(0, -1))
    setHighlightedIds(action.kind === 'remove' ? [action.object.id] : [])
    setDragging(false)
    setReply(null)
    setRenovationMessage('Last renovation undone.')
  }

  async function onReconstruct() {
    if (!graph) return
    const version = sceneVersion.current
    setError(null)
    try {
      const result = await reconstructScene(graph)
      if (version !== sceneVersion.current) return
      setTwinGraph(result.graph)
      setAnalysisSteps(result.analysisSteps)
      setMode('analysing')
    } catch {
      if (version !== sceneVersion.current) return
      setError('Reconstruct failed. Is the backend running?')
    }
  }

  async function ask(question: string) {
    const version = sceneVersion.current
    const scene = twinGraph
    if (mode !== 'twin' || !scene || question.trim().length === 0) return
    setQuery(question)
    try {
      const result = await askScene(scene, question)
      if (version !== sceneVersion.current) return
      setReply(result.reply)
      setHighlightedIds(result.highlightIds)
      setError(null)
    } catch {
      if (version !== sceneVersion.current) return
      setError('Ask failed. Is the backend running?')
    }
  }

  function handleAsk(event: FormEvent) {
    event.preventDefault()
    void ask(query)
  }

  return (
    <div
      className="app"
      data-glass={settings.glassBlur ? 'on' : 'off'}
      data-motion={settings.motion ? 'on' : 'off'}
      data-source={displayGraph?.source ?? 'demo'}
    >
      <Canvas
        shadows="percentage"
        dpr={dprFor(settings)}
        camera={{ position: [6.4, 4.2, 6.8], fov: 42 }}
        gl={{ antialias: true }}
      >
        <ViewerScene
          key={displayGraph?.room.id ?? 'empty'}
          mode={mode}
          graph={displayGraph}
          scanProgress={importedCapture ? 1 : scanProgress}
          settings={settings}
          highlightedIds={highlightedIds}
          editing={editing}
          dragging={dragging}
          onDraggingChange={setDragging}
          onMoveObject={onMoveObject}
          onSelectObject={(id) => setHighlightedIds([id])}
        />
      </Canvas>
      <Hud
        mode={mode}
        graph={displayGraph}
        scanProgress={scanProgress}
        settings={settings}
        query={query}
        reply={reply}
        error={error}
        editing={editing}
        highlightedIds={highlightedIds}
        analysisSteps={analysisSteps}
        visibleStepCount={visibleStepCount}
        onToggleEdit={() => { setEditing((current) => renovating ? true : !current); setRenovating(false) }}
        onQueryChange={setQuery}
        onAsk={handleAsk}
        onAskSuggestion={(value) => {
          void ask(value)
        }}
        onReconstruct={() => {
          void onReconstruct()
        }}
        onSkipScan={skipScan}
        onSelectObject={onSelectObject}
        onSettingsChange={setSettings}
        onImportCapture={onImportCapture}
        renovating={renovating}
        onToggleRenovation={() => { setRenovating((current) => !current); setEditing(true) }}
      />
      {editing && !renovating && mode === 'twin' && twinGraph && (
        <AppearanceEditor graph={twinGraph} selectedIds={highlightedIds} onSelect={onSelectObject}
          onChange={(id, patch) => setTwinGraph((current) => current ? updateAppearance(current, id, patch) : current)} />
      )}
      {renovating && mode === 'twin' && twinGraph && <RenovationPanel graph={twinGraph} selectedIds={highlightedIds}
        canUndo={renovationHistory.length > 0} message={renovationMessage} onSelect={(id) => setHighlightedIds([id])}
        onAdd={(assetId, height) => applyRenovation(() => addFurniture(twinGraph, assetId, `renovation:${crypto.getRandomValues(new Uint32Array(4)).join('-')}`, height))}
        onRemove={(id) => applyRenovation(() => removeFurniture(twinGraph, id))} onUndo={onUndoRenovation}
        onRotate={(id) => {
          try { setTwinGraph(rotateFurniture(twinGraph, id)); setRenovationMessage('Furniture rotated. Drag it to adjust its position.') }
          catch (cause) { setRenovationMessage(cause instanceof Error ? cause.message : 'Could not rotate furniture.') }
        }}
        onAppearance={() => setRenovating(false)} />}
    </div>
  )
}
