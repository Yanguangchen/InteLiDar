import { Canvas } from '@react-three/fiber'
import { useEffect, useState, type FormEvent } from 'react'
import { askScene, ingestScene, reconstructScene } from './api/scene'
import { Hud } from './components/Hud'
import { moveObject } from './scene/editScene'
import { ViewerScene } from './scene/ViewerScene'
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

  const displayGraph = mode === 'twin' && twinGraph ? twinGraph : graph

  useEffect(() => {
    ingestScene()
      .then((scene) => {
        setGraph(scene)
        setError(null)
      })
      .catch(() => {
        setError('Backend unavailable. Start the API on port 8000.')
      })
  }, [])

  useEffect(() => {
    if (mode !== 'analysing' || analysisSteps.length === 0) return

    setVisibleStepCount(0)
    const timers = analysisSteps.map((_, index) =>
      window.setTimeout(() => {
        setVisibleStepCount(index + 1)
        if (index === analysisSteps.length - 1) {
          window.setTimeout(() => setMode('twin'), 700)
        }
      }, 380 * (index + 1)),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [mode, analysisSteps])

  useEffect(() => {
    if (mode === 'analysing' || !editing) {
      setDragging(false)
      document.body.style.cursor = 'auto'
    }
    if (mode === 'analysing') setEditing(false)
  }, [mode, editing])

  function onMoveObject(id: string, position: Vec3) {
    if (mode === 'twin') {
      setTwinGraph((current) => (current ? moveObject(current, id, position) : current))
      return
    }
    setGraph((current) => (current ? moveObject(current, id, position) : current))
  }

  async function onReconstruct() {
    if (!graph) return
    setError(null)
    try {
      const result = await reconstructScene(graph)
      setTwinGraph(result.graph)
      setAnalysisSteps(result.analysisSteps)
      setMode('analysing')
    } catch {
      setError('Reconstruct failed. Is the backend running?')
    }
  }

  async function ask(question: string) {
    const scene = twinGraph
    if (mode !== 'twin' || !scene || question.trim().length === 0) return
    setQuery(question)
    try {
      const result = await askScene(scene, question)
      setReply(result.reply)
      setHighlightedIds(result.highlightIds)
      setError(null)
    } catch {
      setError('Ask failed. Is the backend running?')
    }
  }

  function handleAsk(event: FormEvent) {
    event.preventDefault()
    void ask(query)
  }

  return (
    <div className="app">
      <Canvas
        shadows
        camera={{ position: [6.4, 4.2, 6.8], fov: 42 }}
        gl={{ antialias: true }}
      >
        <ViewerScene
          mode={mode}
          graph={displayGraph}
          highlightedIds={highlightedIds}
          editing={editing}
          dragging={dragging}
          onDraggingChange={setDragging}
          onMoveObject={onMoveObject}
        />
      </Canvas>
      <Hud
        mode={mode}
        graph={displayGraph}
        query={query}
        reply={reply}
        error={error}
        editing={editing}
        analysisSteps={analysisSteps}
        visibleStepCount={visibleStepCount}
        onToggleEdit={() => setEditing((current) => !current)}
        onQueryChange={setQuery}
        onAsk={handleAsk}
        onAskSuggestion={(value) => {
          void ask(value)
        }}
        onReconstruct={() => {
          void onReconstruct()
        }}
      />
    </div>
  )
}
