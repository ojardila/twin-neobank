// Catches render errors so a crash shows a friendly card instead of a blank page.
import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="shell">
          <div className="card center-cta">
            <div style={{ fontSize: 42 }}>⚠️</div>
            <div className="big">Something went wrong</div>
            <p className="muted">{this.state.error.message}</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
