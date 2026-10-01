import { Component, type ReactNode } from 'react'

export function ViewportFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="viewport-fallback">
      <div role="alert">
        <h2>3D view unavailable</h2>
        <p>The 3D view could not load. Your transform controls and values are preserved.</p>
        <p>Check your connection and that your browser supports WebGL with graphics acceleration, then retry when ready.</p>
      </div>
      <button type="button" className="recovery-button" onClick={onRetry}>Retry 3D view</button>
    </div>
  )
}

/** Isolate rendering failures so the transform editor stays mounted. */
export class ViewportErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed
      ? <ViewportFallback onRetry={this.props.onRetry} />
      : this.props.children
  }
}
