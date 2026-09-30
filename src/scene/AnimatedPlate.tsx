import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, Matrix4 } from 'three'
import type { Mat4 } from '../math'

export function AnimatedPlate({ target }: { target: Mat4 }) {
  const group = useRef<Group>(null)
  const scratch = useRef(new Matrix4())
  useFrame((_, delta) => {
    if (!group.current) return
    const alpha = 1 - Math.exp(-4 * delta)
    const current = group.current.matrix.elements
    scratch.current.fromArray(target as unknown as number[])
    const goal = scratch.current.elements
    for (let i = 0; i < 16; i++) current[i] += (goal[i] - current[i]) * alpha
    group.current.matrixWorldNeedsUpdate = true
  })
  return (
    <group ref={group} matrixAutoUpdate={false}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[2.4, 0.08, 2.4]} />
        <meshStandardMaterial color="#4a5560" metalness={0.85} roughness={0.18} envMapIntensity={1.2} />
      </mesh>
    </group>
  )
}
