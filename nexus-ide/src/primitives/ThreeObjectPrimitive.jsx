import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function ForceArrow() {
  return (
    <group position={[0, 1.95, 0]}>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 24]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, -1.18, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 0.34, 28]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  )
}

function ThreeObjectPrimitive() {
  return (
    <div className="three-object-primitive">
      <Canvas camera={{ position: [4.5, 3.4, 5], fov: 45 }}>
        <color attach="background" args={['#161719']} />
        <ambientLight intensity={0.45} />
        <directionalLight intensity={1.1} position={[4, 6, 3]} />
        <directionalLight intensity={0.35} position={[-4, 3, -4]} />

        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[4.8, 0.34, 0.72]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.12} roughness={0.48} />
        </mesh>

        <ForceArrow />

        <gridHelper args={[8, 16, '#334155', '#253040']} position={[0, -0.02, 0]} />
        <mesh position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="#111827" transparent opacity={0.34} />
        </mesh>

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  )
}

export default ThreeObjectPrimitive
