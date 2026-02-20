import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function PipelinePage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sourcesWithStats = await Promise.all(
        (data || []).map(async (source) => {
          const [
            { count: totalChunks },
            { count: processedChunks },
            { count: totalEvidences },
            { count: approvedEvidences },
            { count: totalClusters },
            { count: totalEntities },
          ] = await Promise.all([
            supabase.from('kb_raw_chunks').select('*', { count: 'exact', head: true }).eq('source_id', source.id),
            supabase.from('kb_raw_chunks').select('*', { count: 'exact', head: true }).eq('source_id', source.id).eq('processed', true),
            supabase.from('kb_evidence_excerpts').select('*', { count: 'exact', head: true }).eq('source_id', source.id),
            supabase.from('kb_evidence_excerpts').select('*', { count: 'exact', head: true }).eq('source_id', source.id).eq('status', 'approved'),
            supabase.from('kb_evidence_clusters').select('*', { count: 'exact', head: true }).eq('source_id', source.id),
            supabase.from('kb_extracted_entities').select('*', { count: 'exact', head: true }).eq('source_id', source.id),
          ]);

          return {
            ...source,
            stats: {
              totalChunks: totalChunks || 0,
              processedChunks: processedChunks || 0,
              totalEvidences: totalEvidences || 0,
              approvedEvidences: approvedEvidences || 0,
              totalClusters: totalClusters || 0,
              totalEntities: totalEntities || 0,
            },
          };
        })
      );

      setSources(sourcesWithStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processA1 = async (sourceId: string) => {
    try {
      setProcessing({ ...processing, [`a1-${sourceId}`]: true });

      // Refresh session to get a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-a1`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          sourceId: sourceId,
          profileId: 'a1-basic-v1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== ERRO HTTP A1 ===');
        console.error('Status:', response.status);
        console.error('Response body:', errorText);

        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
          if (errorJson.details) {
            console.error('Error details:', errorJson.details);
          }
          if (errorJson.stack) {
            console.error('Error stack:', errorJson.stack);
          }
        } catch (parseError) {
          errorMessage = errorText.substring(0, 500);
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('A1 processado:', result);

      alert(`A1 processado com sucesso! ${result.clustersCreated || 0} clusters criados.`);
      await loadData();
    } catch (error) {
      console.error('=== ERRO AO PROCESSAR A1 ===');
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
      }
      console.error('Full error:', error);

      alert(`Erro ao processar A1: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessing({ ...processing, [`a1-${sourceId}`]: false });
    }
  };

  const processA2 = async (sourceId: string) => {
    try {
      setProcessing({ ...processing, [`a2-${sourceId}`]: true });

      // Refresh session to get a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-a2`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          sourceId: sourceId,
          profileId: 'a2-basic-v1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('A2 processado:', result);

      alert(`A2 processado com sucesso! ${result.entitiesCreated || 0} entidades e ${result.relationsCreated || 0} relações criadas.`);
      await loadData();
    } catch (error) {
      console.error('Erro ao processar A2:', error);
      alert(`Erro ao processar A2: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessing({ ...processing, [`a2-${sourceId}`]: false });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando pipeline...
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
        Pipeline de Processamento
      </h1>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          Esta página permite processar as etapas A1 (agrupamento de evidências) e A2 (extração de entidades e relações) para cada documento.
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          <strong>Ordem de processamento:</strong> P0 (chunking) → A0 (extração de evidências) → Aprovação humana → A1 (clusters) → A2 (entidades)
        </p>
      </div>

      {sources.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Nenhum documento encontrado. Ingeste um documento primeiro.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sources.map((source) => (
            <div
              key={source.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '24px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
              }}>
                <div>
                  <h2 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>
                    {source.title}
                  </h2>
                  {source.author && (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {source.author}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {source.stats.totalChunks}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Chunks</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {source.stats.processedChunks}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Processados</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {source.stats.totalEvidences}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Evidências</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#d1fae5', borderRadius: '6px', border: '1px solid #10b981' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#065f46' }}>
                    {source.stats.approvedEvidences}
                  </div>
                  <div style={{ fontSize: '11px', color: '#065f46' }}>Aprovadas</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {source.stats.totalClusters}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Clusters</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {source.stats.totalEntities}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Entidades</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => processA1(source.id)}
                  disabled={processing[`a1-${source.id}`] || source.stats.approvedEvidences === 0}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: source.stats.approvedEvidences === 0 ? '#d1d5db' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: source.stats.approvedEvidences === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {processing[`a1-${source.id}`] ? 'Processando A1...' : 'Processar A1 (Clusters)'}
                </button>

                <button
                  onClick={() => processA2(source.id)}
                  disabled={processing[`a2-${source.id}`] || source.stats.totalClusters === 0}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: source.stats.totalClusters === 0 ? '#d1d5db' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: source.stats.totalClusters === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {processing[`a2-${source.id}`] ? 'Processando A2...' : 'Processar A2 (Entidades)'}
                </button>

                <div style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                  {source.stats.approvedEvidences === 0 && (
                    <span>Aprove evidências primeiro para processar A1</span>
                  )}
                  {source.stats.approvedEvidences > 0 && source.stats.totalClusters === 0 && (
                    <span>Processe A1 primeiro para criar clusters</span>
                  )}
                  {source.stats.totalClusters > 0 && source.stats.totalEntities === 0 && (
                    <span>Pronto para processar A2</span>
                  )}
                  {source.stats.totalEntities > 0 && (
                    <span style={{ color: '#10b981', fontWeight: '600' }}>Pipeline completo!</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PipelinePage;
