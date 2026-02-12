import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DocumentsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

function DocumentsPage({ onNavigate }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_sources')
        .select(`
          *,
          kb_document_pipeline_status(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.author && doc.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando documentos...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '40px auto',
      padding: '0 24px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h1 style={{ fontSize: '32px', color: '#1a1a1a' }}>
          Documentos
        </h1>
        <button
          onClick={() => onNavigate('ingest')}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Novo Documento
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Buscar documentos por título ou autor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredDocuments.map((doc) => {
          const pipeline = doc.kb_document_pipeline_status?.[0];

          return (
            <div
              key={doc.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '24px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('chunks', { sourceId: doc.id })}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                    {doc.title}
                  </h3>

                  {doc.author && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      Autor: {doc.author}
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                    {doc.source_type} • Criado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  {pipeline && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: pipeline.p0_status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: pipeline.p0_status === 'completed' ? '#065f46' : '#92400e',
                        fontWeight: '500',
                      }}>
                        P0: {pipeline.p0_status}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: pipeline.a0_status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: pipeline.a0_status === 'completed' ? '#065f46' : '#92400e',
                        fontWeight: '500',
                      }}>
                        A0: {pipeline.a0_status}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: pipeline.a1_status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: pipeline.a1_status === 'completed' ? '#065f46' : '#92400e',
                        fontWeight: '500',
                      }}>
                        A1: {pipeline.a1_status}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginLeft: '24px',
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('chunks', { sourceId: doc.id });
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Ver Chunks
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('evidences', { sourceId: doc.id });
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Ver Evidências
                  </button>
                </div>
              </div>

              {pipeline && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  gap: '16px',
                }}>
                  <span>Chunks: {pipeline.total_chunks}</span>
                  <span>Evidências: {pipeline.total_evidences}</span>
                  <span>Aprovadas: {pipeline.approved_evidences}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          color: '#6b7280',
        }}>
          {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento cadastrado ainda'}
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;
