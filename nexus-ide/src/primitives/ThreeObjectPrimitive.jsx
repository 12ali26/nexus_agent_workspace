import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { getThemeToken } from '../styles/themeTokens'

const objectTypes = ['Beam', 'Sphere', 'Cube', 'Cylinder']
const forceDirections = ['Top', 'Bottom', 'Left', 'Right']

function ForceArrow({ direction }) {
  const forceColor = getThemeToken('--accent-red', '#f85149')
  const transforms = {
    Bottom: {
      position: [0, -1.55, 0],
      rotation: [0, 0, Math.PI],
    },
    Left: {
      position: [-2.05, 0.8, 0],
      rotation: [0, 0, -Math.PI / 2],
    },
    Right: {
      position: [2.05, 0.8, 0],
      rotation: [0, 0, Math.PI / 2],
    },
    Top: {
      position: [0, 2.2, 0],
      rotation: [0, 0, 0],
    },
  }
  const transform = transforms[direction] ?? transforms.Top

  return (
    <group position={transform.position} rotation={transform.rotation}>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 24]} />
        <meshStandardMaterial color={forceColor} />
      </mesh>
      <mesh position={[0, -1.18, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 0.34, 28]} />
        <meshStandardMaterial color={forceColor} />
      </mesh>
    </group>
  )
}

function SceneObject({ color, objectType, scale }) {
  return (
    <mesh position={[0, 0.75, 0]} scale={[scale.x, scale.y, scale.z]}>
      {objectType === 'Beam' && <boxGeometry args={[4.8, 0.34, 0.72]} />}
      {objectType === 'Cube' && <boxGeometry args={[1.4, 1.4, 1.4]} />}
      {objectType === 'Sphere' && <sphereGeometry args={[0.9, 48, 32]} />}
      {objectType === 'Cylinder' && <cylinderGeometry args={[0.72, 0.72, 1.8, 48]} />}
      <meshStandardMaterial color={color} metalness={0.12} roughness={0.48} />
    </mesh>
  )
}

function ThreeObjectPrimitive() {
  const controlsRef = useRef(null)
  const [objectType, setObjectType] = useState('Beam')
  const [objectColor, setObjectColor] = useState(() =>
    getThemeToken('--text-secondary', '#8b949e'),
  )
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 })
  const [showForceArrow, setShowForceArrow] = useState(true)
  const [forceDirection, setForceDirection] = useState('Top')

  const updateScale = (axis, value) => {
    setScale((currentScale) => ({
      ...currentScale,
      [axis]: Number(value),
    }))
  }

  return (
    <div className="three-object-primitive">
      <div className="three-object-scene">
        <Canvas camera={{ position: [4.5, 3.4, 5], fov: 45 }}>
          <color attach="background" args={[getThemeToken('--bg-panel', '#151b23')]} />
          <ambientLight intensity={0.45} />
          <directionalLight intensity={1.1} position={[4, 6, 3]} />
          <directionalLight intensity={0.35} position={[-4, 3, -4]} />

          <SceneObject color={objectColor} objectType={objectType} scale={scale} />

          {showForceArrow && <ForceArrow direction={forceDirection} />}

          <gridHelper
            args={[
              8,
              16,
              getThemeToken('--border-strong', '#3d4f63'),
              getThemeToken('--border-subtle', '#1e2530'),
            ]}
            position={[0, -0.02, 0]}
          />
          <mesh position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 8]} />
            <meshStandardMaterial
              color={getThemeToken('--bg-base', '#0b0f14')}
              transparent
              opacity={0.34}
            />
          </mesh>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>
      </div>

      <aside className="three-properties-panel">
        <label>
          <span>Object</span>
          <select
            value={objectType}
            onChange={(event) => setObjectType(event.target.value)}
          >
            {objectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        {['x', 'y', 'z'].map((axis) => (
          <label key={axis}>
            <span>Scale {axis.toUpperCase()}</span>
            <input
              max="5"
              min="0.1"
              step="0.1"
              type="range"
              value={scale[axis]}
              onChange={(event) => updateScale(axis, event.target.value)}
            />
            <strong>{scale[axis].toFixed(1)}</strong>
          </label>
        ))}

        <label className="three-toggle-control">
          <span>Force Arrow</span>
          <input
            checked={showForceArrow}
            type="checkbox"
            onChange={(event) => setShowForceArrow(event.target.checked)}
          />
        </label>

        <label>
          <span>Direction</span>
          <select
            value={forceDirection}
            onChange={(event) => setForceDirection(event.target.value)}
          >
            {forceDirections.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Color</span>
          <input
            type="color"
            value={objectColor}
            onChange={(event) => setObjectColor(event.target.value)}
          />
        </label>

        <button type="button" onClick={() => controlsRef.current?.reset()}>
          Reset Rotation
        </button>
      </aside>
    </div>
  )
}

export default ThreeObjectPrimitive
