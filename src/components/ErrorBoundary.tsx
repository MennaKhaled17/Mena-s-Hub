import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f6fb', fontFamily:"'Segoe UI','Cairo',sans-serif" }}>
          <div style={{ textAlign:'center', maxWidth:420, padding:32 }}>
            <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#111827', marginBottom:8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize:14, color:'#6b7280', marginBottom:24, lineHeight:1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </div>
            <button
              onClick={() => { this.setState({ hasError:false, error:null }); window.location.reload(); }}
              style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:10, padding:'11px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}