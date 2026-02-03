import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.lastPathname = window.location.pathname;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  componentDidUpdate() {
    // Auto-recover when user navigates to a different page
    if (this.state.hasError && window.location.pathname !== this.lastPathname) {
      this.lastPathname = window.location.pathname;
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
          <h1 style={{ color: '#e11d48' }}>Ops! Algo deu errado.</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Desculpe, ocorreu um erro inesperado na aplicação.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Recarregar Página
          </button>
          
          <div style={{ marginTop: '40px', textAlign: 'left', background: '#f8fafc', padding: '20px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0 }}>Detalhes técnicos:</h3>
            <p style={{ color: '#dc2626', fontFamily: 'monospace' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <pre style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
