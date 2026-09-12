import { Html, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Plane, Vector2, Vector3, type Mesh } from 'three'
import { canDragObject } from './editScene'
import type { SceneGraph, SceneMode, SceneObject, SceneRoom, Vec3 } from './types'

const FALLBACK_ROOM: SceneRoom = {
  id: 'room-1',
  name: 'meeting room',
  width: 7.4,
  depth: 5.2,
  height: 2.8,
  units: 'm',
}

const floorHit = new Vector3()
const floorNdc = new Vector2()
const floorPlane = new Plane(new Vector3(0, 1, 0), 0)

type ViewerSceneProps = {
  mode: SceneMode
  graph: SceneGraph | null
  highlightedIds: string[]
  editing: boolean
  dragging: boolean
  onDraggingChange: (dragging: boolean) => void
  onMoveObject: (id: string, position: Vec3) => void
}

export function ViewerScene({
  mode,
  graph,
  highlightedIds,
  editing,
  dragging,
  onDraggingChange,
  onMoveObject,
}: ViewerSceneProps) {
  const reconstructed = mode === 'twin'
  const room = graph?.room ?? FALLBACK_ROOM
  const objects = graph?.objects ?? []

  return (
    <>
      <color attach="background" args={[reconstructed ? '#0c1218' : '#08090c']} />
      <fog attach="fog" args={[reconstructed ? '#0c1218' : '#08090c', 8, 22]} />

      <hemisphereLight args={[reconstructed ? '#d8e4ff' : '#9aa3b2', '#1a1c20', reconstructed ? 0.7 : 0.35]} />
      <directionalLight
        position={[4, 7, 3]}
        intensity={reconstructed ? 1.35 : 0.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {reconstructed && <pointLight position={[0, 2.4, 0]} intensity={0.4} color="#f2e6c9" />}

      <OrbitControls
        makeDefault
        enableDamping
        enabled={!dragging}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={3}
        maxDistance={16}
        target={[0, 1, 0]}
      />

      <group position={[0, 0, 0]}>
        <RoomShell reconstructed={reconstructed} room={room} />
        {objects.map((object) => (
          <SceneMesh
            key={object.id}
            object={object}
            reconstructed={reconstructed}
            highlighted={highlightedIds.includes(object.id)}
            editing={editing}
            onDraggingChange={onDraggingChange}
            onMoveObject={onMoveObject}
          />
        ))}
        {mode !== 'twin' && <ScanSweep room={room} />}
        <gridHelper
          args={[12, 24, reconstructed ? '#1e3a3a' : '#1c2430', reconstructed ? '#15222a' : '#12161c']}
          position={[0, 0.001, 0]}
        />
      </group>
    </>
  )
}

function RoomShell({ reconstructed, room }: { reconstructed: boolean; room: SceneRoom }) {
  const wall = reconstructed ? '#d9d3c7' : '#2a2d33'
  const floor = reconstructed ? '#b08968' : '#30343b'
  const ceiling = reconstructed ? '#ece8df' : '#24272c'
  const roughness = reconstructed ? 0.82 : 1
  const wireframe = !reconstructed

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={floor} roughness={roughness} wireframe={wireframe} />
      </mesh>

      <mesh position={[0, room.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={ceiling} roughness={0.95} wireframe={wireframe} side={2} />
      </mesh>

      <mesh position={[0, room.height / 2, -room.depth / 2]} receiveShadow>
        <planeGeometry args={[room.width, room.height]} />
        <meshStandardMaterial color={wall} roughness={roughness} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, room.height / 2, room.depth / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[room.width, room.height]} />
        <meshStandardMaterial color={wall} roughness={roughness} wireframe={wireframe} />
      </mesh>
      <mesh position={[-room.width / 2, room.height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[room.depth, room.height]} />
        <meshStandardMaterial color={wall} roughness={roughness} wireframe={wireframe} />
      </mesh>
      <mesh position={[room.width / 2, room.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[room.depth, room.height]} />
        <meshStandardMaterial
          color={reconstructed ? '#cfd8dc' : wall}
          roughness={roughness}
          wireframe={wireframe}
          transparent={reconstructed}
          opacity={reconstructed ? 0.35 : 1}
        />
      </mesh>
    </group>
  )
}

function SceneMesh({
  object,
  reconstructed,
  highlighted,
  editing,
  onDraggingChange,
  onMoveObject,
}: {
  object: SceneObject
  reconstructed: boolean
  highlighted: boolean
  editing: boolean
  onDraggingChange: (dragging: boolean) => void
  onMoveObject: (id: string, position: Vec3) => void
}) {
  const { camera, gl, raycaster } = useThree()
  const dragging = useRef(false)
  const objectRef = useRef(object)
  const moveRef = useRef(onMoveObject)
  const dragChangeRef = useRef(onDraggingChange)
  objectRef.current = object
  moveRef.current = onMoveObject
  dragChangeRef.current = onDraggingChange
  const draggable = editing && canDragObject(object)
  const color = reconstructed ? object.color ?? '#8d8d8d' : '#6a717c'
  const isGlass = reconstructed && object.material === 'glass'

  useEffect(() => {
    function projectClient(clientX: number, clientY: number) {
      const current = objectRef.current
      const rect = gl.domElement.getBoundingClientRect()
      floorNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(floorNdc, camera)
      if (!raycaster.ray.intersectPlane(floorPlane, floorHit)) return
      moveRef.current(current.id, [floorHit.x, current.position[1], floorHit.z])
    }

    function onWindowMove(event: PointerEvent) {
      if (!dragging.current) return
      projectClient(event.clientX, event.clientY)
    }

    function onWindowUp() {
      if (!dragging.current) return
      dragging.current = false
      dragChangeRef.current(false)
      document.body.style.cursor = 'auto'
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    return () => {
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
    }
  }, [camera, gl, raycaster])

  return (
    <group position={object.position}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(event) => {
          if (!draggable) return
          event.stopPropagation()
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          if (!dragging.current) document.body.style.cursor = 'auto'
        }}
        onPointerDown={(event) => {
          if (!draggable) return
          event.stopPropagation()
          event.nativeEvent.stopImmediatePropagation()
          dragging.current = true
          onDraggingChange(true)
          document.body.style.cursor = 'grabbing'
        }}
      >
        <boxGeometry args={object.size} />
        <meshStandardMaterial
          color={highlighted || (editing && draggable) ? (highlighted ? '#3ee0c2' : color) : color}
          roughness={isGlass ? 0.12 : reconstructed ? 0.7 : 1}
          metalness={object.material === 'metal' && reconstructed ? 0.45 : 0}
          wireframe={!reconstructed}
          transparent={isGlass || highlighted}
          opacity={isGlass ? 0.35 : highlighted ? 0.92 : 1}
          emissive={highlighted ? '#3ee0c2' : draggable ? '#3ee0c2' : '#000000'}
          emissiveIntensity={highlighted ? 0.55 : draggable ? 0.12 : 0}
        />
      </mesh>
      {reconstructed && (
        <Html
          position={[0, object.size[1] / 2 + 0.18, 0]}
          center
          distanceFactor={8}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`label ${highlighted ? 'label-hot' : ''}`}>{object.label}</div>
        </Html>
      )}
    </group>
  )
}

function ScanSweep({ room }: { room: SceneRoom }) {
  const ref = useRef<Mesh>(null)
  const geometry = useMemo(() => [room.width, 0.035] as const, [room.width])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.z = Math.sin(state.clock.elapsedTime * 0.55) * (room.depth / 2 - 0.15)
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={geometry} />
      <meshBasicMaterial color="#3ee0c2" transparent opacity={0.55} />
    </mesh>
  )
}
