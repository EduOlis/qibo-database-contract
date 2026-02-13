function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '40px',
    }}>
      <h1 style={{
        color: '#000000',
        fontSize: '48px',
        marginBottom: '20px',
      }}>
        Sistema de Conhecimento
      </h1>
      <p style={{
        color: '#333333',
        fontSize: '24px',
      }}>
        Aplicação carregada com sucesso!
      </p>
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
      }}>
        <p style={{ color: '#666666' }}>
          Se você está vendo este texto, o React está funcionando corretamente.
        </p>
      </div>
    </div>
  )
}

export default App
