import { Viewport } from '../scene/Viewport'
import { useTransformLab } from '../lab/useTransformLab'
import { ControlsWindow } from './ControlsWindow'

export function Dock() {
  const lab = useTransformLab()
  const { controlsOpen, setControlsOpen, renderOpen, setRenderOpen, menuOpen, setMenuOpen, targets, stage } = lab
  const anyMinimized = !controlsOpen || !renderOpen
  const bothOpen = controlsOpen && renderOpen

  return (
    <div className="dock-shell">
      <div className={`window-manager ${anyMinimized ? 'has-minimized' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <button className="window-menu-button" aria-label="Window menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
        {menuOpen && (
          <div className="window-menu">
            <button onClick={() => setControlsOpen((v) => !v)}><span>{controlsOpen ? '✓' : ''}</span> Controls</button>
            <button onClick={() => setRenderOpen((v) => !v)}><span>{renderOpen ? '✓' : ''}</span> Render</button>
          </div>
        )}
      </div>
      <div className={`workspace ${bothOpen ? 'both-windows' : 'single-window'}`}>
        {controlsOpen && <ControlsWindow lab={lab} />}
        {renderOpen && (
          <section className="window render-window">
            <header className="window-titlebar render-titlebar">
              <div className="window-heading">
                <span className="window-kicker">viewport</span>
                <strong>Render</strong>
              </div>
              <button className="icon-button" onClick={() => setRenderOpen(false)}>−</button>
            </header>
            <div className="canvas-frame">
              <Viewport target={targets[stage]} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
