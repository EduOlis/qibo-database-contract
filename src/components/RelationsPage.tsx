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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
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

      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas ({relations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded ${
              filter === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded ${
              filter === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejeitadas
          </button>
        </div>

        <div>
          <select
            value={selectedRelationType}
            onChange={(e) => setSelectedRelationType(e.target.value)}
            className="px-4 py-2 border rounded"
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16"></th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[180px]">Tipo de Relação</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">Entidade Origem</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20"></th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">Entidade Destino</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-28">Confiança</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-56">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {relations.map((relation) => (
                <>
                  <tr
                    key={relation.id}
                    className="hover:bg-blue-50 cursor-pointer transition-all duration-150"
                    onClick={() => setExpandedRelation(expandedRelation === relation.id ? null : relation.id)}
                  >
                    <td className="px-6 py-5">
                      <svg
                        className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                          expandedRelation === relation.id ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-6 py-5">
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
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-gray-900">
                        {getRelationTypeLabel(relation.relation_type)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {relation.from_entity?.entity_label || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {relation.from_entity?.entity_type || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-3xl text-blue-400 font-light">→</span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {relation.to_entity?.entity_label || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {relation.to_entity?.entity_type || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-xl font-bold ${getConfidenceColor(relation.confidence_score)}`}>
                        {(relation.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      {relation.status === 'pending' && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => updateRelationStatus(relation.id, 'approved')}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => updateRelationStatus(relation.id, 'rejected')}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150"
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
