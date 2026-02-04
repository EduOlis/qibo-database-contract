interface HomePageProps {
  onNavigate: (page: string) => void;
}

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '50px auto',
      padding: '40px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        fontSize: '32px',
        marginBottom: '40px',
        color: '#1a1a1a',
        textAlign: 'center'
      }}>
        Sistema de Casos Clínicos
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => onNavigate('new-case')}
          style={{
            padding: '16px 24px',
            fontSize: '18px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Criar Novo Caso
        </button>

        <button
          onClick={() => onNavigate('case-list')}
          style={{
            padding: '16px 24px',
            fontSize: '18px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          Ver Casos Anteriores
        </button>
      </div>
    </div>
  );
}

export default HomePage;