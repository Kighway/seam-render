import { Dock } from './Dock'

export default function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', fontSize: 14, opacity: 0.8 }}>
        seam-render — Three inside a React component. Drag to orbit.
      </header>
      <div style={{ flex: 1 }}>
        <Dock />
      </div>
    </div>
  )
}
