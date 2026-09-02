import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-error-container text-on-error-container rounded-2xl border border-error/20 my-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-error/10 text-error rounded-xl shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-on-surface">
                {this.props.fallbackTitle || 'Error en el módulo de administración'}
              </h3>
              <p className="text-xs text-secondary mt-1">
                {this.state.error?.message || 'Ha ocurrido un error inesperado al renderizar esta sección.'}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error hover:bg-error/90 text-on-error rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw size={13} />
                  <span>Reintentar carga</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
