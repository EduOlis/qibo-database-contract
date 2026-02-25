import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user, signOut } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ingest', label: 'Ingerir Documento', icon: '📄' },
    { id: 'documents', label: 'Documentos', icon: '📚' },
    { id: 'pipeline', label: 'Pipeline', icon: '⚙️' },
    { id: 'clusters', label: 'Clusters', icon: '🔗' },
    { id: 'entities', label: 'Entidades', icon: '🏷️' },
    { id: 'relations', label: 'Relações', icon: '🔀' },
    { id: 'validate', label: 'Validação', icon: '✓' },
    { id: 'audit', label: 'Auditoria', icon: '🔍' },
  ];

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '12px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minWidth: 'fit-content',
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#ffffff',
          whiteSpace: 'nowrap',
          minWidth: 'fit-content',
        }}>
          Sistema de Conhecimento
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: currentPage === item.id ? '#374151' : 'transparent',
                color: currentPage === item.id ? '#ffffff' : '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
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

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginLeft: '16px',
          whiteSpace: 'nowrap',
        }}>
          {user && (
            <>
              <span style={{
                color: '#d1d5db',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
