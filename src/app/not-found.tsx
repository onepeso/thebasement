export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#09090b',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: '#27272a' }}>404</h1>
        <p style={{ color: '#71717a', marginTop: '0.5rem' }}>Page not found</p>
      </div>
    </div>
  );
}
