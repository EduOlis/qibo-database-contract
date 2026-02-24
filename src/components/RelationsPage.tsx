import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Relation {
  id: string;
  source_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relation_type: string;
  textual_evidence: string;
  evidence_ids: string[];
  confidence_score: number;
  extraction_rationale: string;
  status: string;
  created_at: string;
  from_entity?: {
    entity_type: string;
    entity_label: string;
  };
  to_entity?: {
    entity_type: string;
    entity_label: string;
  };
}

export function RelationsPage() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRelationType, setSelectedRelationType] = useState<string>('all');
  const [expandedRelation, setExpandedRelation] = useState<string | null>(null);

  useEffect(() => {
    loadRelations();
  }, [filter, selectedRelationType]);

  async function loadRelations() {
    setLoading(true);
    try {
      let query = supabase
        .from('kb_entity_relations_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (selectedRelationType !== 'all') {
        query = query.eq('relation_type', selectedRelationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const relationsWithEntities = await Promise.all(
          data.map(async (rel) => {
            const [fromEntity, toEntity] = await Promise.all([
              supabase
                .from('kb_extracted_entities')
                .select('entity_type, entity_label')
                .eq('id', rel.from_entity_id)
                .single(),
              supabase
                .from('kb_extracted_entities')
                .select('entity_type, entity_label')
                .eq('id', rel.to_entity_id)
                .single(),
            ]);

            return {
              ...rel,
              from_entity: fromEntity.data || undefined,
              to_entity: toEntity.data || undefined,
            };
          })
        );

        setRelations(relationsWithEntities);
      }
    } catch (error) {
      console.error('Erro ao carregar relações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRelationStatus(relationId: string, newStatus: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('kb_entity_relations_proposals')
        .update({ status: newStatus })
        .eq('id', relationId);

      if (error) throw error;

      loadRelations();
    } catch (error) {
      console.error('Erro ao atualizar status da relação:', error);
    }
  }

  const relationTypes = [
    'all',
    'has_symptom',
    'has_clinical_sign',
    'treated_by_principle',
    'treated_by_acupoint',
    'causes',
    'alleviates',
    'contraindicated_with',
    'combined_with',
  ];

  const getRelationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      has_symptom: 'Apresenta Sintoma',
      has_clinical_sign: 'Apresenta Sinal Clínico',
      treated_by_principle: 'Tratado por Princípio',
      treated_by_acupoint: 'Tratado por Acuponto',
      causes: 'Causa',
      alleviates: 'Alivia',
      contraindicated_with: 'Contraindicado com',
      combined_with: 'Combinado com',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Carregando relações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Relações entre Entidades</h1>
        <p className="text-gray-600">
          Visualize e valide as relações identificadas pelo agente A3
        </p>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filter === 'all' ? '#2563eb' : '#e5e7eb',
              color: filter === 'all' ? 'white' : '#374151',
            }}
          >
            Todas ({relations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filter === 'pending' ? '#eab308' : '#e5e7eb',
              color: filter === 'pending' ? 'white' : '#374151',
            }}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filter === 'approved' ? '#16a34a' : '#e5e7eb',
              color: filter === 'approved' ? 'white' : '#374151',
            }}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filter === 'rejected' ? '#dc2626' : '#e5e7eb',
              color: filter === 'rejected' ? 'white' : '#374151',
            }}
          >
            Rejeitadas
          </button>
        </div>

        <div>
          <select
            value={selectedRelationType}
            onChange={(e) => setSelectedRelationType(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {relationTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'Todos os tipos' : getRelationTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {relations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-600">Nenhuma relação encontrada</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'auto',
          border: '1px solid #e5e7eb'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'linear-gradient(to right, #f3f4f6, #f9fafb)' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}></th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '180px' }}>Tipo de Relação</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '180px' }}>Entidade Origem</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}></th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '180px' }}>Entidade Destino</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Confiança</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '220px' }}>Ações</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {relations.map((relation) => (
                <>
                  <tr
                    key={relation.id}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      borderTop: '1px solid #e5e7eb',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    onClick={() => setExpandedRelation(expandedRelation === relation.id ? null : relation.id)}
                  >
                    <td style={{ padding: '1.5rem' }}>
                      <svg
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          color: '#6b7280',
                          transition: 'transform 0.2s',
                          transform: expandedRelation === relation.id ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <span
                        className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                          relation.status
                        )}`}
                      >
                        {relation.status === 'pending'
                          ? 'Pendente'
                          : relation.status === 'approved'
                          ? 'Aprovada'
                          : 'Rejeitada'}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                        {getRelationTypeLabel(relation.relation_type)}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>
                          {relation.from_entity?.entity_label || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                          {relation.from_entity?.entity_type || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '2rem', color: '#60a5fa', fontWeight: '300' }}>→</span>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>
                          {relation.to_entity?.entity_label || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                          {relation.to_entity?.entity_type || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: relation.confidence_score >= 0.8 ? '#16a34a' : relation.confidence_score >= 0.5 ? '#eab308' : '#dc2626'
                      }}>
                        {(relation.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      {relation.status === 'pending' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                          <button
                            onClick={() => updateRelationStatus(relation.id, 'approved')}
                            style={{
                              padding: '0.75rem 1.5rem',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => updateRelationStatus(relation.id, 'rejected')}
                            style={{
                              padding: '0.75rem 1.5rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedRelation === relation.id && (
                    <tr className="bg-gradient-to-b from-gray-50 to-white">
                      <td colSpan={8} className="px-6 py-8">
                        <div className="max-w-6xl mx-auto space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                              Evidência Textual
                            </h4>
                            <div className="bg-white border-l-4 border-blue-500 p-5 rounded-lg shadow-sm">
                              <p className="text-sm text-gray-800 italic leading-relaxed">
                                "{relation.textual_evidence}"
                              </p>
                            </div>
                          </div>

                          {relation.extraction_rationale && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                                Justificativa da Extração
                              </h4>
                              <div className="bg-white p-5 rounded-lg border border-gray-300 shadow-sm">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {relation.extraction_rationale}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                            <strong>ID:</strong> {relation.id}<br/>
                            <strong>Criado em:</strong> {new Date(relation.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
