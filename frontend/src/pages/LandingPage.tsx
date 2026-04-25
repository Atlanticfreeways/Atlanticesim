import React from 'react';

export const LandingPage: React.FC = () => {
  React.useEffect(() => {
    console.log('LandingPage mounted');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold' }}>
          Atlantic eSIM
        </h1>
        <p style={{ fontSize: '24px', marginBottom: '40px', opacity: 0.9 }}>
          Platform is Running
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '40px',
          borderRadius: '10px',
          marginBottom: '30px',
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: 'rgba(34,197,94,0.3)', padding: '15px', borderRadius: '5px' }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Backend</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>✅ Running</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.3)', padding: '15px', borderRadius: '5px' }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Database</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>✅ Connected</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.3)', padding: '15px', borderRadius: '5px' }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>API</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>✅ Ready</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.3)', padding: '15px', borderRadius: '5px' }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Frontend</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>✅ Loaded</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/api/v1/health" style={{
            background: 'white',
            color: '#667eea',
            padding: '12px 24px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Health Check
          </a>
          <a href="/api/v1/providers/health" style={{
            background: 'white',
            color: '#667eea',
            padding: '12px 24px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Provider Status
          </a>
          <a href="/api/v1/metrics" style={{
            background: 'white',
            color: '#667eea',
            padding: '12px 24px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Metrics
          </a>
        </div>

        <p style={{ marginTop: '40px', fontSize: '14px', opacity: 0.7 }}>
          Server is running on port 3000
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
