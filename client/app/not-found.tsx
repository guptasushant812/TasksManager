'use client';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        opacity: 0.05,
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
        opacity: 0.03,
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite'
      }} />

      {/* Main Content */}
      <main style={{
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: 600
      }}>
        <div style={{
          fontSize: 'clamp(120px, 20vw, 200px)',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-muted) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 24,
          userSelect: 'none'
        }}>
          404
        </div>
        
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: 16
        }}>
          Page not found
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 400
        }}>
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
      </main>

      {/* Global Animation Styles for Floating Elements */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
          100% { transform: translateY(0px); }
        }
      `}} />
    </div>
  );
}
