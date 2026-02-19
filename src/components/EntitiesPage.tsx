import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EntitiesPageProps {
  onBack: () => void;
}

function EntitiesPage({ onBack }: EntitiesPageProps) {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus]);

  const loadData = async () => {
    try {
      let query = supabase
        .from('kb_extracted_entities')
        .select(`
          *,
          kb_evidence_excerpts!inner(excerpt_text, chunk_id),
          kb_sources!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterType !== 'all') {
        query = query.eq('entity_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      alert('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('kb_extracted_entities')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', entityId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar entidade');
    }
  };

  const handleReject = async (entityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const notes = prompt('Motivo da rejeição (opcional):');

      const { error } = await supabase
        .from('kb_extracted_entities')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || '',
        })
        .eq('id', entityId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar entidade');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      syndrome: 'Síndrome',
      symptom: 'Sintoma',
      clinical_sign: 'Sinal Clínico',
      acupoint: 'Acuponto',
      therapeutic_principle: 'Princípio Terapêutico',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      syndrome: { bg: '#dbeafe', text: '#1e40af' },
      symptom: { bg: '#fef3c7', text: '#92400e' },
      clinical_sign: { bg: '#d1fae5', text: '#065f46' },
      acupoint: { bg: '#fce7f3', text: '#9f1239' },
      therapeutic_principle: { bg: '#e0e7ff', text: '#3730a3' },
    };
    return colors[type] || { bg: '#f3f4f6', text: '#1f2937' };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando entidades...
      </div>
    );
  }

  const stats = {
    total: entities.length,
    pending: entities.filter(e => e.status === 'pending').length,
    approved: entities.filter(e => e.status === 'approved').length,
    rejected: entities.filter(e => e.status === 'rejected').length,
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '0 24px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{ fontSize: '28px', color: '#1a1a1a', margin: 0 }}>
            Entidades Extraídas
          </h1>
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Voltar
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos os Tipos</option>
            <option value="syndrome">Síndromes</option>
            <option value="symptom">Sintomas</option>
            <option value="clinical_sign">Sinais Clínicos</option>
            <option value="acupoint">Acupontos</option>
            <option value="therapeutic_principle">Princípios Terapêuticos</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '14px',
          color: '#6b7280',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          flexWrap: 'wrap',
        }}>
          <div><strong>Total:</strong> {stats.total}</div>
          <div style={{ color: '#f59e0b' }}><strong>Pendentes:</strong> {stats.pending}</div>
          <div style={{ color: '#10b981' }}><strong>Aprovadas:</strong> {stats.approved}</div>
          <div style={{ color: '#ef4444' }}><strong>Rejeitadas:</strong> {stats.rejected}</div>
        </div>
      </div>

      <div>
        {entities.map((entity) => {
          const typeColor = getTypeColor(entity.entity_type);
          const isExpanded = expandedId === entity.id;

          return (
            <div
              key={entity.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: typeColor.bg,
                      color: typeColor.text,
                      fontWeight: '600',
                    }}>
                      {getTypeLabel(entity.entity_type)}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: entity.status === 'approved' ? '#d1fae5' : entity.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: entity.status === 'approved' ? '#065f46' : entity.status === 'rejected' ? '#991b1b' : '#92400e',
                      fontWeight: '500',
                    }}>
                      {entity.status === 'pending' ? 'Pendente' : entity.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                    }}>
                      Confiança: {Math.round((entity.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 8px 0',
                  }}>
                    {entity.entity_label}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Fonte: {entity.kb_sources?.title || 'Desconhecida'}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entity.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {isExpanded ? 'Ocultar' : 'Detalhes'}
                </button>
              </div>

              {isExpanded && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '12px',
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ fontSize: '13px', color: '#374151' }}>Evidência Textual:</strong>
                    <div style={{
                      marginTop: '4px',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1f2937',
                      lineHeight: '1.6',
                    }}>
                      {entity.kb_evidence_excerpts?.excerpt_text || 'N/A'}
                    </div>
                  </div>

                  {entity.extraction_rationale && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#374151' }}>Justificativa:</strong>
                      <div style={{
                        marginTop: '4px',
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.5',
                      }}>
                        {entity.extraction_rationale}
                      </div>
                    </div>
                  )}

                  {entity.entity_data && Object.keys(entity.entity_data).length > 0 && (
                    <div>
                      <strong style={{ fontSize: '13px', color: '#374151' }}>Dados Estruturados:</strong>
                      <div style={{
                        marginTop: '4px',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#1f2937',
                      }}>
                        {JSON.stringify(entity.entity_data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {entity.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReject(entity.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleApprove(entity.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Aprovar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {entities.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }}>
            Nenhuma entidade encontrada.
          </div>
        )}
      </div>
    </div>
  );
}

export default EntitiesPage;
