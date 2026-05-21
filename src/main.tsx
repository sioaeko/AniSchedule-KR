import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in AniSchedule-KR:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000000',
          color: '#f5f5f7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#09090b',
            border: '1px solid #18181b',
            borderRadius: '8px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              애플리케이션 실행 오류
            </h2>
            <p style={{
              fontSize: '11px',
              color: '#a1a1aa',
              margin: '0 0 20px 0',
              lineHeight: '1.6'
            }}>
              렌더링 중 오류가 발생하여 화면을 표시할 수 없습니다. 캐시 데이터 충돌일 수 있으니 아래 버튼을 눌러 초기화를 시도해 주세요.
            </p>
            
            <div style={{
              textAlign: 'left',
              backgroundColor: '#020203',
              border: '1px solid #18181b',
              borderRadius: '6px',
              padding: '12px',
              margin: '0 0 20px 0',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <code style={{
                fontSize: '10.5px',
                fontFamily: 'monospace',
                color: '#f87171',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: '1.5'
              }}>
                {this.state.error?.toString() || 'Unknown Error'}
                {"\n\n"}
                {this.state.error?.stack || ''}
              </code>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 16px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
              >
                캐시 비우기 및 초기화
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#18181b',
                  color: '#e4e4e7',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  padding: '9px 16px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
