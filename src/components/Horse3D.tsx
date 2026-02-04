import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface HorseProps {
  color: string
  nickname?: string
  speed?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  isStatic?: boolean
}

export function Horse3D({ color, nickname, speed = 0, position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.8, isStatic = false }: HorseProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Body parts refs for animation
  const bodyRef = useRef<THREE.Group>(null)
  const neckRef = useRef<THREE.Group>(null)
  const flLegRef = useRef<THREE.Group>(null) // Front Left
  const frLegRef = useRef<THREE.Group>(null) // Front Right
  const blLegRef = useRef<THREE.Group>(null) // Back Left
  const brLegRef = useRef<THREE.Group>(null) // Back Right
  const tailRef = useRef<THREE.Group>(null)

  // Materials
  const materials = useMemo(() => {
    const main = new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true })
    const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), roughness: 0.8, flatShading: true })
    const hoof = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9, flatShading: true })
    const hair = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.3), roughness: 1, flatShading: true })
    return { main, dark, hoof, hair }
  }, [color])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    // Speed factor: if static (preview), simulate movement
    const effectiveSpeed = isStatic ? 2 : speed
    const gallopSpeed = 10 + effectiveSpeed * 3
    const runAnim = effectiveSpeed > 0.1 || isStatic

    if (runAnim && bodyRef.current) {
        // Body Bobbing
        bodyRef.current.position.y = 1.4 + Math.sin(time * gallopSpeed * 2) * 0.1
        bodyRef.current.rotation.z = Math.sin(time * gallopSpeed) * 0.05 // Pitching (using Z because model faces X)

        // Neck bob (counter motion)
        if (neckRef.current) {
            neckRef.current.rotation.z = Math.PI/4 + Math.sin(time * gallopSpeed) * 0.1
        }

        // Leg Cycles (Rotary Gallop approximation)
        // Legs are pivoted at the top
        const swingAmp = 0.6 + effectiveSpeed * 0.05

        if (flLegRef.current) flLegRef.current.rotation.z = Math.sin(time * gallopSpeed) * swingAmp
        if (frLegRef.current) frLegRef.current.rotation.z = Math.sin(time * gallopSpeed + 0.5) * swingAmp
        if (blLegRef.current) blLegRef.current.rotation.z = Math.sin(time * gallopSpeed + Math.PI) * swingAmp
        if (brLegRef.current) brLegRef.current.rotation.z = Math.sin(time * gallopSpeed + Math.PI + 0.5) * swingAmp
        
        // Tail
        if (tailRef.current) {
            tailRef.current.rotation.z = Math.PI/4 + Math.sin(time * gallopSpeed * 2) * 0.2
        }
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      
      {/* Wrapper to center the model and lift it so y=0 is ground */}
      <group position={[0, 1.4, 0]} ref={bodyRef}>
        
        {/* === BODY === */}
        {/* Main Torso */}
        <mesh material={materials.main} castShadow>
            <boxGeometry args={[1.6, 0.7, 0.6]} /> {/* Length(X), Height(Y), Width(Z) */}
        </mesh>

        {/* === NECK & HEAD === */}
        <group ref={neckRef} position={[0.7, 0.3, 0]} rotation={[0, 0, Math.PI/4]}>
            {/* Neck */}
            <mesh position={[0.3, 0, 0]} material={materials.main} castShadow>
                <boxGeometry args={[0.8, 0.4, 0.35]} />
            </mesh>
            {/* Mane */}
            <mesh position={[0.2, 0.25, 0]} material={materials.hair}>
                <boxGeometry args={[0.7, 0.15, 0.05]} />
            </mesh>
            
            {/* Head Group */}
            <group position={[0.7, 0.1, 0]} rotation={[0, 0, -Math.PI/2.5]}>
                {/* Skull */}
                <mesh position={[0.15, 0, 0]} material={materials.main} castShadow>
                    <boxGeometry args={[0.4, 0.35, 0.3]} />
                </mesh>
                {/* Snout */}
                <mesh position={[0.4, -0.05, 0]} material={materials.dark} castShadow>
                    <boxGeometry args={[0.3, 0.2, 0.2]} />
                </mesh>
                {/* Ears */}
                <mesh position={[-0.05, 0.2, 0.1]} material={materials.main}>
                    <boxGeometry args={[0.1, 0.2, 0.05]} />
                </mesh>
                <mesh position={[-0.05, 0.2, -0.1]} material={materials.main}>
                    <boxGeometry args={[0.1, 0.2, 0.05]} />
                </mesh>
            </group>
        </group>

        {/* === TAIL === */}
        <group ref={tailRef} position={[-0.8, 0.3, 0]} rotation={[0, 0, Math.PI/4]}>
            <mesh position={[-0.3, 0, 0]} material={materials.hair}>
                <boxGeometry args={[0.8, 0.15, 0.1]} />
            </mesh>
        </group>

        {/* === LEGS === */}
        {/* Front Left */}
        <group ref={flLegRef} position={[0.6, -0.2, 0.2]}>
            <mesh position={[0, -0.4, 0]} material={materials.main} castShadow>
                <boxGeometry args={[0.15, 0.8, 0.15]} />
            </mesh>
            <mesh position={[0, -0.85, 0]} material={materials.hoof}>
                <boxGeometry args={[0.16, 0.15, 0.16]} />
            </mesh>
        </group>

        {/* Front Right */}
        <group ref={frLegRef} position={[0.6, -0.2, -0.2]}>
            <mesh position={[0, -0.4, 0]} material={materials.main} castShadow>
                <boxGeometry args={[0.15, 0.8, 0.15]} />
            </mesh>
            <mesh position={[0, -0.85, 0]} material={materials.hoof}>
                <boxGeometry args={[0.16, 0.15, 0.16]} />
            </mesh>
        </group>

        {/* Back Left */}
        <group ref={blLegRef} position={[-0.6, -0.2, 0.2]}>
            <mesh position={[0, -0.4, 0]} material={materials.main} castShadow>
                <boxGeometry args={[0.18, 0.8, 0.18]} />
            </mesh>
            <mesh position={[0, -0.85, 0]} material={materials.hoof}>
                <boxGeometry args={[0.19, 0.15, 0.19]} />
            </mesh>
        </group>

        {/* Back Right */}
        <group ref={brLegRef} position={[-0.6, -0.2, -0.2]}>
             <mesh position={[0, -0.4, 0]} material={materials.main} castShadow>
                <boxGeometry args={[0.18, 0.8, 0.18]} />
            </mesh>
            <mesh position={[0, -0.85, 0]} material={materials.hoof}>
                <boxGeometry args={[0.19, 0.15, 0.19]} />
            </mesh>
        </group>

      </group>

      {/* Name Tag */}
      {nickname && (
          <Html position={[0, 2.5, 0]} center distanceFactor={10}>
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border-2 border-yellow-500 text-black font-bold whitespace-nowrap text-sm select-none">
              {nickname}
            </div>
          </Html>
      )}
    </group>
  )
}
