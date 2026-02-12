interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ingest', label: 'Ingerir Documento', icon: '📄' },
    { id: 'documents', label: 'Documentos', icon: '📚' },
    { id: 'validate', label: 'Validação', icon: '✓' },
    { id: 'audit', label: 'Auditoria', icon: '🔍' },
  ];

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '16px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#ffffff',
          marginRight: '24px',
        }}>
          Sistema de Conhecimento
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: currentPage === item.id ? '#374151' : 'transparent',
                color: currentPage === item.id ? '#ffffff' : '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#d1d5db';
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
