import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalSources: 0,
    totalChunks: 0,
    totalEvidences: 0,
    pendingEvidences: 0,
    approvedEvidences: 0,
  });
  const [recentSources, setRecentSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { count: sourcesCount } = await supabase
        .from('kb_sources')
        .select('*', { count: 'exact', head: true });

      const { count: chunksCount } = await supabase
        .from('kb_raw_chunks')
        .select('*', { count: 'exact', head: true });

      const { count: evidencesCount } = await supabase
        .from('kb_evidence_excerpts')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('kb_evidence_excerpts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedCount } = await supabase
        .from('kb_evidence_excerpts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: sources } = await supabase
        .from('kb_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalSources: sourcesCount || 0,
        totalChunks: chunksCount || 0,
        totalEvidences: evidencesCount || 0,
        pendingEvidences: pendingCount || 0,
        approvedEvidences: approvedCount || 0,
      });

      setRecentSources(sources || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '40px auto',
      padding: '0 24px',
    }}>
      <h1 style={{ fontSize: '32px', color: '#1a1a1a', marginBottom: '32px' }}>
        Dashboard
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Documentos
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937' }}>
            {stats.totalSources}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Chunks Gerados
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937' }}>
            {stats.totalChunks}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Evidências
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937' }}>
            {stats.totalEvidences}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          border: '2px solid #fbbf24',
        }}>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
            Pendentes de Revisão
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#92400e' }}>
            {stats.pendingEvidences}
          </div>
        </div>

        <div style={{
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          border: '2px solid #10b981',
        }}>
          <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '8px' }}>
            Aprovadas
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#065f46' }}>
            {stats.approvedEvidences}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '20px' }}>
            Documentos Recentes
          </h2>

          {recentSources.length > 0 ? (
            <div>
              {recentSources.map((source) => (
                <div
                  key={source.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                  }}
                  onClick={() => onNavigate('chunks', { sourceId: source.id })}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    {source.title}
                  </div>
                  {source.author && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      {source.author}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(source.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Nenhum documento encontrado
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '20px' }}>
            Ações Rápidas
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => onNavigate('ingest')}
              style={{
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              📄 Ingerir Novo Documento
            </button>

            <button
              onClick={() => onNavigate('validate')}
              style={{
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ✓ Revisar Evidências
            </button>

            <button
              onClick={() => onNavigate('documents')}
              style={{
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              📚 Ver Todos os Documentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
