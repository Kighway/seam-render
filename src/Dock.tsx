import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState, type WheelEvent } from 'react'
import { Group, Matrix3, Matrix4 } from 'three'

type Stage = 0 | 1 | 2
type TransformKind = 'rotate' | 'scale' | 'shear' | 'ill'
type Axis = 'x' | 'y' | 'z'
type ShearPlane = 'xy' | 'xz' | 'yx' | 'yz' | 'zx' | 'zy'

const identity = new Matrix4()
const stageNames = ['Original', 'Transformed', 'Restored'] as const

function AnimatedPlate({ target }: { target: Matrix4 }) {
  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!group.current) return
    const alpha = 1 - Math.exp(-4 * delta)
    const current = group.current.matrix.elements
    const goal = target.elements
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

function Stanchion({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
      <meshStandardMaterial color="#2b3036" metalness={0.4} roughness={0.5} />
    </mesh>
  )
}

function MatrixReadout({ matrix }: { matrix: Matrix4 }) {
  const e = matrix.clone().transpose().elements
  return <pre className="matrix-readout">{[0,1,2,3].map(row => `[ ${[0,1,2,3].map(col => e[row*4+col].toFixed(3).padStart(7)).join(' ')} ]`).join('\n')}</pre>
}

function conditionNumber(matrix: Matrix4) {
  const a = new Matrix3().setFromMatrix4(matrix)
  const e = a.elements
  const rows = [[e[0],e[3],e[6]],[e[1],e[4],e[7]],[e[2],e[5],e[8]]]
  const ata = Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>rows.reduce((sum,row)=>sum+row[i]*row[j],0)))
  for (let n=0;n<20;n++) {
    let p=0,q=1
    for (const [i,j] of [[0,1],[0,2],[1,2]] as const) if (Math.abs(ata[i][j])>Math.abs(ata[p][q])) [p,q]=[i,j]
    if (Math.abs(ata[p][q])<1e-15) break
    const theta=.5*Math.atan2(2*ata[p][q],ata[q][q]-ata[p][p]), c=Math.cos(theta), s=Math.sin(theta)
    const app=c*c*ata[p][p]-2*s*c*ata[p][q]+s*s*ata[q][q], aqq=s*s*ata[p][p]+2*s*c*ata[p][q]+c*c*ata[q][q]
    for (let k=0;k<3;k++) if(k!==p&&k!==q){const apk=c*ata[p][k]-s*ata[q][k], aqk=s*ata[p][k]+c*ata[q][k];ata[p][k]=ata[k][p]=apk;ata[q][k]=ata[k][q]=aqk}
    ata[p][p]=app;ata[q][q]=aqq;ata[p][q]=ata[q][p]=0
  }
  const eigen=[ata[0][0],ata[1][1],ata[2][2]].map(v=>Math.max(0,v)).sort((a,b)=>a-b)
  return Math.sqrt(eigen[2]/eigen[0])
}

const axisButtons = (axis: Axis, setAxis: (axis: Axis) => void) => (
  <div className="axis-buttons">{(['x','y','z'] as Axis[]).map(a => <button key={a} className={axis===a?'active':''} onClick={()=>setAxis(a)}>{a.toUpperCase()}</button>)}</div>
)

export function Dock() {
  const [stage,setStage]=useState<Stage>(0)
  const [kind,setKind]=useState<TransformKind>('rotate')
  const [rotationAxis,setRotationAxis]=useState<Axis>('y')
  const [angle,setAngle]=useState(45)
  const [scale,setScale]=useState({x:1.7,y:1,z:.55})
  const [shearPlane,setShearPlane]=useState<ShearPlane>('xy')
  const [shear,setShear]=useState(.85)
  const [illAxis,setIllAxis]=useState<Axis>('z')
  const [epsilon,setEpsilon]=useState(.0001)
  const [compact,setCompact]=useState(true)
  const [controlsOpen,setControlsOpen]=useState(true)
  const [renderOpen,setRenderOpen]=useState(true)
  const [menuOpen,setMenuOpen]=useState(false)

  const transform=useMemo(()=>{
    if(kind==='rotate') {
      const r=angle*Math.PI/180
      return rotationAxis==='x'?new Matrix4().makeRotationX(r):rotationAxis==='y'?new Matrix4().makeRotationY(r):new Matrix4().makeRotationZ(r)
    }
    if(kind==='scale') return new Matrix4().makeScale(scale.x,scale.y,scale.z)
    if(kind==='shear') {
      const values:Record<ShearPlane,number[]>={xy:[1,shear,0,0,0,1,0,0,0,0,1,0,0,0,0,1],xz:[1,0,shear,0,0,1,0,0,0,0,1,0,0,0,0,1],yx:[1,0,0,0,shear,1,0,0,0,0,1,0,0,0,0,1],yz:[1,0,0,0,0,1,shear,0,0,0,1,0,0,0,0,1],zx:[1,0,0,0,0,1,0,0,shear,0,1,0,0,0,0,1],zy:[1,0,0,0,0,1,0,0,0,shear,1,0,0,0,0,1]}
      return new Matrix4().set(...values[shearPlane] as [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number])
    }
    const s={x:1,y:1,z:1};s[illAxis]=Math.max(1e-8,epsilon);return new Matrix4().makeScale(s.x,s.y,s.z)
  },[kind,rotationAxis,angle,scale,shearPlane,shear,illAxis,epsilon])

  const inverse=useMemo(()=>transform.clone().invert(),[transform])
  const restored=useMemo(()=>transform.clone().multiply(inverse),[transform,inverse])
  const targets=[identity,transform,restored] as const
  const shownMatrix=stage===0?identity:stage===1?transform:inverse
  const kappa=useMemo(()=>conditionNumber(transform),[transform])
  const anyMinimized=!controlsOpen||!renderOpen, bothOpen=controlsOpen&&renderOpen
  const wheelAngle=(e:WheelEvent<HTMLInputElement>)=>{e.preventDefault();setAngle(v=>Math.max(-180,Math.min(180,v+(e.deltaY<0?1:-1))))}

  return <div className="dock-shell">
    <div className={`window-manager ${anyMinimized?'has-minimized':''} ${menuOpen?'menu-open':''}`}>
      <button className="window-menu-button" aria-label="Window menu" onClick={()=>setMenuOpen(v=>!v)}>☰</button>
      {menuOpen&&<div className="window-menu"><button onClick={()=>setControlsOpen(v=>!v)}><span>{controlsOpen?'✓':''}</span> Controls</button><button onClick={()=>setRenderOpen(v=>!v)}><span>{renderOpen?'✓':''}</span> Render</button></div>}
    </div>
    <div className={`workspace ${bothOpen?'both-windows':'single-window'}`}>
      {controlsOpen&&<aside className={`window controls-window ${compact?'compact':'expanded'}`}>
        <header className="window-titlebar"><div className="window-heading"><span className="window-kicker">seam-render</span><strong>Transform</strong></div><div className="window-actions"><span className={`kappa-badge ${kappa>100?'warning':''}`}>κ {kappa.toExponential(1)}</span><button className="compact-toggle" onClick={()=>setCompact(v=>!v)}>{compact?'Details':'Mini'}</button><button className="icon-button" onClick={()=>setControlsOpen(false)}>−</button></div></header>
        <div className="controls-body">
          <div className="transform-tabs">{([['rotate','Rotate'],['scale','Scale'],['shear','Shear'],['ill','Ill-conditioned']] as [TransformKind,string][]).map(([key,label])=><button key={key} className={kind===key?'active':''} onClick={()=>{setKind(key);setStage(1)}}>{label}</button>)}</div>
          <div className="transform-editor">
            {kind==='rotate'&&<><div className="editor-row"><span>Axis</span>{axisButtons(rotationAxis,setRotationAxis)}</div><div className="editor-row"><span>Angle</span><div className="number-unit"><input type="number" value={angle} min={-180} max={180} step={1} onWheel={wheelAngle} onChange={e=>setAngle(Number(e.target.value))}/><b>°</b></div></div><input className="range" type="range" min={-180} max={180} step={1} value={angle} onChange={e=>setAngle(Number(e.target.value))}/></>}
            {kind==='scale'&&<div className="xyz-grid">{(['x','y','z'] as Axis[]).map(a=><label key={a}><span>{a.toUpperCase()}</span><input type="number" step="0.05" value={scale[a]} onChange={e=>setScale({...scale,[a]:Number(e.target.value)})}/></label>)}</div>}
            {kind==='shear'&&<><div className="editor-row"><span>Plane</span><select value={shearPlane} onChange={e=>setShearPlane(e.target.value as ShearPlane)}>{(['xy','xz','yx','yz','zx','zy'] as ShearPlane[]).map(p=><option key={p}>{p.toUpperCase()}</option>)}</select></div><div className="editor-row"><span>Amount</span><input type="number" step="0.05" value={shear} onChange={e=>setShear(Number(e.target.value))}/></div><input className="range" type="range" min={-2} max={2} step={.05} value={shear} onChange={e=>setShear(Number(e.target.value))}/></>}
            {kind==='ill'&&<><div className="editor-row"><span>Weak axis</span>{axisButtons(illAxis,setIllAxis)}</div><div className="editor-row"><span>ε</span><input type="number" min="0.00000001" max="1" step="0.0001" value={epsilon} onChange={e=>setEpsilon(Number(e.target.value))}/></div><input className="range logarithmic" type="range" min={1} max={8} step={.05} value={-Math.log10(Math.max(1e-8,epsilon))} onChange={e=>setEpsilon(Math.pow(10,-Number(e.target.value)))}/></>}
          </div>
          <div className="field state-field"><span>State</span><div className="segmented">{stageNames.map((name,index)=><button key={name} className={stage===index?'active':''} onClick={()=>setStage(index as Stage)}>{name}</button>)}</div></div>
          <div className="verbose-only"><div className="status-row"><span>condition number κ₂(X)</span><strong className={kappa>100?'warning':''}>{kappa.toExponential(3)}</strong></div><div className="matrix-card"><div className="matrix-title">{stage===0?'I':stage===1?'X':'X⁻¹'}</div><MatrixReadout matrix={shownMatrix}/></div><p className="hint">{kind==='shear'?`${shearPlane.toUpperCase()}: first axis is offset in proportion to the second.`:kind==='ill'?`The ${illAxis.toUpperCase()} axis is scaled by ε; smaller ε drives the matrix toward singularity.`:'Tap a value for precision; use the slider for exploration.'}</p></div>
        </div>
      </aside>}
      {renderOpen&&<section className="window render-window"><header className="window-titlebar render-titlebar"><div className="window-heading"><span className="window-kicker">viewport</span><strong>Render</strong></div><button className="icon-button" onClick={()=>setRenderOpen(false)}>−</button></header><div className="canvas-frame"><Canvas shadows camera={{position:[4.2,2.8,5.2],fov:40}} dpr={[1,2]}><color attach="background" args={['#8a93a0']}/><fog attach="fog" args={['#8a93a0',8,22]}/><hemisphereLight args={['#cfd6de','#3a4048',.55]}/><directionalLight position={[6,8,4]} intensity={1.35} castShadow/><AnimatedPlate target={targets[stage]}/><Stanchion position={[1.6,.6,1.4]}/><Stanchion position={[-1.5,.6,1.2]}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.05,0]} receiveShadow><planeGeometry args={[40,40]}/><meshStandardMaterial color="#6d7680" roughness={1}/></mesh><Environment preset="city"/><OrbitControls enablePan={false} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI/2.05}/></Canvas></div></section>}
    </div>
  </div>
}
