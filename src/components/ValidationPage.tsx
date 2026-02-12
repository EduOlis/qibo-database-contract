import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EvidenceCard from './EvidenceCard';

function ValidationPage() {
  const [activeTab, setActiveTab] = useState<'evidences' | 'clusters' | 'tensions'>('evidences');
  const [evidences, setEvidences] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [tensions, setTensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'evidences') {
        const { data, error } = await supabase
          .from('kb_evidence_excerpts')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setEvidences(data || []);
      } else if (activeTab === 'clusters') {
        const { data, error } = await supabase
          .from('kb_evidence_clusters')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setClusters(data || []);
      } else if (activeTab === 'tensions') {
        const { data, error } = await supabase
          .from('kb_textual_tensions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTensions(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvidence = async (evidenceId: string) => {
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

  const handleRejectEvidence = async (evidenceId: string) => {
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

  const handleApproveCluster = async (clusterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('kb_evidence_clusters')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', clusterId);

      if (error) throw error;

      await supabase
        .from('kb_validation_actions')
        .insert({
          entity_type: 'cluster',
          entity_id: clusterId,
          action: 'approved',
          reviewed_by: user.id,
        });

      loadData();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar cluster');
    }
  };

  const handleAcknowledgeTension = async (tensionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('kb_textual_tensions')
        .update({
          status: 'acknowledged',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', tensionId);

      if (error) throw error;

      await supabase
        .from('kb_validation_actions')
        .insert({
          entity_type: 'tension',
          entity_id: tensionId,
          action: 'acknowledged',
          reviewed_by: user.id,
        });

      loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao reconhecer tensão');
    }
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '40px auto',
      padding: '0 24px',
    }}>
      <h1 style={{ fontSize: '32px', color: '#1a1a1a', marginBottom: '32px' }}>
        Painel de Validação
      </h1>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => setActiveTab('evidences')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: activeTab === 'evidences' ? '#ffffff' : '#f9fafb',
              color: activeTab === 'evidences' ? '#2563eb' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'evidences' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
            }}
          >
            Evidências Pendentes ({evidences.length})
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: activeTab === 'clusters' ? '#ffffff' : '#f9fafb',
              color: activeTab === 'clusters' ? '#2563eb' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'clusters' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
            }}
          >
            Clusters Pendentes ({clusters.length})
          </button>
          <button
            onClick={() => setActiveTab('tensions')}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: activeTab === 'tensions' ? '#ffffff' : '#f9fafb',
              color: activeTab === 'tensions' ? '#2563eb' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'tensions' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
            }}
          >
            Tensões Não Revisadas ({tensions.length})
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Carregando...
            </div>
          ) : (
            <>
              {activeTab === 'evidences' && (
                <>
                  {evidences.length > 0 ? (
                    evidences.map((evidence) => (
                      <EvidenceCard
                        key={evidence.id}
                        evidence={evidence}
                        onApprove={handleApproveEvidence}
                        onReject={handleRejectEvidence}
                        showActions={true}
                      />
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Nenhuma evidência pendente
                    </div>
                  )}
                </>
              )}

              {activeTab === 'clusters' && (
                <>
                  {clusters.length > 0 ? (
                    clusters.map((cluster) => (
                      <div
                        key={cluster.id}
                        style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '20px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '12px',
                        }}>
                          {cluster.cluster_label}
                        </div>

                        {cluster.cluster_basis && (
                          <div style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '12px',
                          }}>
                            Base: {cluster.cluster_basis}
                          </div>
                        )}

                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginBottom: '12px',
                        }}>
                          {cluster.evidence_ids?.length || 0} evidências agrupadas
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveCluster(cluster.id)}
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
                            Aprovar Cluster
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Nenhum cluster pendente
                    </div>
                  )}
                </>
              )}

              {activeTab === 'tensions' && (
                <>
                  {tensions.length > 0 ? (
                    tensions.map((tension) => (
                      <div
                        key={tension.id}
                        style={{
                          backgroundColor: '#fff7ed',
                          border: '1px solid #fb923c',
                          borderRadius: '8px',
                          padding: '20px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#ea580c',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                        }}>
                          {tension.tension_type}
                        </div>

                        <div style={{
                          fontSize: '14px',
                          color: '#1f2937',
                          marginBottom: '12px',
                          lineHeight: '1.6',
                        }}>
                          {tension.tension_description}
                        </div>

                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          marginBottom: '12px',
                        }}>
                          Base textual: {tension.textual_basis}
                        </div>

                        <button
                          onClick={() => handleAcknowledgeTension(tension.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Reconhecer Tensão
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Nenhuma tensão não revisada
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ValidationPage;
