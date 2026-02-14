import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ChunkViewer from './ChunkViewer';

interface ChunksPageProps {
  sourceId?: string;
  onBack: () => void;
}

function ChunksPage({ sourceId, onBack }: ChunksPageProps) {
  const [chunks, setChunks] = useState<any[]>([]);
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sourceId) {
      loadData();
    }
  }, [sourceId]);

  const loadData = async () => {
    try {
      console.log('Loading data for sourceId:', sourceId);

      const { data: sourceData, error: sourceError } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      console.log('Source data:', sourceData, 'Error:', sourceError);
      if (sourceError) throw sourceError;
      setSource(sourceData);

      const { data: chunksData, error: chunksError } = await supabase
        .from('kb_raw_chunks')
        .select('*')
        .eq('source_id', sourceId)
        .order('sequence_number', { ascending: true });

      console.log('Chunks data:', chunksData, 'Error:', chunksError);
      if (chunksError) throw chunksError;
      setChunks(chunksData || []);
    } catch (error) {
      console.error('Erro ao carregar chunks:', error);
      alert(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessA0 = async () => {
    if (!sourceId) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-a0`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: sourceId,
          profileId: 'a0-basic-v1',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar');
      }

      alert(`Sucesso! ${data.evidencesCreated} evidências extraídas`);
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar');
    } finally {
      setProcessing(false);
    }
  };

  const filteredChunks = chunks.filter(chunk =>
    chunk.raw_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Carregando chunks...
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
              Chunks do Documento
            </h1>
            {source && (
              <div style={{ fontSize: '16px', color: '#6b7280' }}>
                {source.title}
                {source.author && ` - ${source.author}`}
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
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <input
            type="text"
            placeholder="Buscar no texto dos chunks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
            }}
          />
          <button
            onClick={handleProcessA0}
            disabled={processing || chunks.filter(c => !c.processed).length === 0}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: processing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: processing || chunks.filter(c => !c.processed).length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? 'Processando...' : 'Extrair Evidências (A0)'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '14px',
          color: '#6b7280',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
        }}>
          <div>
            <strong>Total:</strong> {chunks.length} chunks
          </div>
          <div>
            <strong>Processados:</strong> {chunks.filter(c => c.processed).length}
          </div>
          <div>
            <strong>Pendentes:</strong> {chunks.filter(c => !c.processed).length}
          </div>
        </div>
      </div>

      <div>
        {filteredChunks.map((chunk) => (
          <ChunkViewer key={chunk.id} chunk={chunk} />
        ))}
        {filteredChunks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }}>
            Nenhum chunk encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChunksPage;
