import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#333', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ff4444' }}>🚨 Ops! O React Crashou.</h1>
          <p>Aqui está o erro exato que causou a tela preta:</p>
          <pre style={{ background: '#000', padding: '15px', color: '#ffaaaa', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <p>Stack trace:</p>
          <pre style={{ background: '#000', padding: '15px', color: '#aaaaaa', overflow: 'auto' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
