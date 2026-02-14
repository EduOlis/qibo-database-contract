import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EvidenceCard from './EvidenceCard';

interface EvidencesPageProps {
  sourceId?: string;
  onBack: () => void;
}

function EvidencesPage({ sourceId, onBack }: EvidencesPageProps) {
  const [evidences, setEvidences] = useState<any[]>([]);
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (sourceId) {
      loadData();
    }
  }, [sourceId]);

  const loadData = async () => {
    try {
      console.log('Loading evidences for sourceId:', sourceId);

      const { data: sourceData, error: sourceError } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      console.log('Source data:', sourceData, 'Error:', sourceError);
      if (sourceError) throw sourceError;
      setSource(sourceData);

      const { data: evidencesData, error: evidencesError } = await supabase
        .from('kb_evidence_excerpts')
        .select('*')
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false });

      console.log('Evidences data:', evidencesData, 'Error:', evidencesError);
      if (evidencesError) throw evidencesError;
      setEvidences(evidencesData || []);
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      alert(`Erro ao carregar evidências: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (evidenceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('kb_evidence_excerpts')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', evidenceId);

      if (error) throw error;

      await supabase
        .from('kb_validation_actions')
        .insert({
          entity_type: 'evidence',
          entity_id: evidenceId,
          action: 'approved',
          reviewed_by: user.id,
        });

      loadData();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar evidência');
    }
  };

  const handleReject = async (evidenceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('kb_evidence_excerpts')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', evidenceId);

      if (error) throw error;

      await supabase
        .from('kb_validation_actions')
        .insert({
          entity_type: 'evidence',
          entity_id: evidenceId,
          action: 'rejected',
          reviewed_by: user.id,
        });

      loadData();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar evidência');
    }
  };

  const filteredEvidences = evidences.filter((evidence) => {
    if (filter !== 'all' && evidence.status !== filter) return false;
    if (typeFilter !== 'all' && evidence.suggested_entity_type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: evidences.length,
    pending: evidences.filter(e => e.status === 'pending').length,
    approved: evidences.filter(e => e.status === 'approved').length,
    rejected: evidences.filter(e => e.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando evidências...
      </div>
    );
  }

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
          <div>
            <h1 style={{ fontSize: '28px', color: '#1a1a1a', marginBottom: '8px' }}>
              Evidências Extraídas
            </h1>
            {source && (
              <div style={{ fontSize: '16px', color: '#6b7280' }}>
                {source.title}
              </div>
            )}
          </div>
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
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fbbf24',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
              {stats.pending}
            </div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>Pendentes</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#d1fae5',
            borderRadius: '6px',
            border: '1px solid #10b981',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
              {stats.approved}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>Aprovadas</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '6px',
            border: '1px solid #ef4444',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
              {stats.rejected}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>Rejeitadas</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="all">Todos os Tipos</option>
            <option value="symptom">Sintoma</option>
            <option value="syndrome">Síndrome</option>
            <option value="clinical_sign">Sinal Clínico</option>
            <option value="acupoint">Ponto</option>
            <option value="therapeutic_principle">Princípio Terapêutico</option>
            <option value="other">Outro</option>
          </select>
        </div>
      </div>

      <div>
        {filteredEvidences.map((evidence) => (
          <EvidenceCard
            key={evidence.id}
            evidence={evidence}
            onApprove={handleApprove}
            onReject={handleReject}
            showActions={true}
          />
        ))}
        {filteredEvidences.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }}>
            Nenhuma evidência encontrada com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}

export default EvidencesPage;
