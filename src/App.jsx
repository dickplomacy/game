function App() {
  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      background: '#fff'
    }}>
      <h1 style={{ margin: '0 0 1rem', fontSize: '2.25rem', letterSpacing: '0.02em' }}>
        dickplomacy - deploy test
      </h1>
      <img
        src="public/dipmap.jpg" 
        alt="dipmap"
        style={{ maxWidth: '90%', height: 'auto', border: 0 }}
      />
    </div>
  );
}

export default App;
