export function Stanchion({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
      <meshStandardMaterial color="#2b3036" metalness={0.4} roughness={0.5} />
    </mesh>
  )
}
