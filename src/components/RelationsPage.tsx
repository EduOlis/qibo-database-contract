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
        <div className="space-y-6">
          {relations.map((relation) => (
            <div
              key={relation.id}
              className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
            >
              <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                        relation.status
                      )}`}
                    >
                      {relation.status === 'pending'
                        ? 'PENDENTE'
                        : relation.status === 'approved'
                        ? 'APROVADA'
                        : 'REJEITADA'}
                    </span>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-900 rounded-full text-sm font-semibold">
                      {getRelationTypeLabel(relation.relation_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-medium">Confiança</div>
                      <div className={`text-2xl font-bold ${getConfidenceColor(relation.confidence_score)}`}>
                        {(relation.confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    {relation.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRelationStatus(relation.id, 'approved')}
                          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow-sm"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => updateRelationStatus(relation.id, 'rejected')}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold shadow-sm"
                        >
                          ✗ Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-3 tracking-wide">
                    Relação Identificada
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-semibold mb-1 uppercase">
                        {relation.from_entity?.entity_type || 'N/A'}
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        {relation.from_entity?.entity_label || 'Entidade desconhecida'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center px-4">
                      <div className="text-3xl text-gray-400 font-light">→</div>
                    </div>
                    <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 font-semibold mb-1 uppercase">
                        {relation.to_entity?.entity_type || 'N/A'}
                      </div>
                      <div className="text-lg font-bold text-green-900">
                        {relation.to_entity?.entity_label || 'Entidade desconhecida'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">
                    Evidência Textual
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <p className="text-sm text-gray-800 italic leading-relaxed">
                      "{relation.textual_evidence}"
                    </p>
                  </div>
                </div>

                {relation.extraction_rationale && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">
                      Justificativa da Extração
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {relation.extraction_rationale}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-3 border-t border-gray-200">
                  Criado em: {new Date(relation.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
