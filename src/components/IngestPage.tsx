import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface IngestPageProps {
  onBack: () => void;
}

function IngestPage({ onBack }: IngestPageProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [sourceType, setSourceType] = useState('book');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [executionProfile, setExecutionProfile] = useState('p0-txt-basic-v1');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-p0`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTitle: title,
          sourceAuthor: author || undefined,
          sourceYear: year ? parseInt(year) : undefined,
          sourceType,
          rawText: text,
          executionProfile,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar documento');
      }

      setResult(data);
    } catch (err) {
      console.error('Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '24px',
            color: '#10b981',
            marginBottom: '8px',
          }}>
            Documento Processado com Sucesso
          </h2>
        </div>

        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>ID do Documento:</strong> {result.sourceId}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Chunks Criados:</strong> {result.chunksCreated}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Idioma Detectado:</strong> {result.language}
          </div>
          <div>
            <strong>Tempo de Execução:</strong> {result.executionTimeMs}ms
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setResult(null);
              setTitle('');
              setAuthor('');
              setYear('');
              setText('');
              setNotes('');
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Ingerir Outro Documento
          </button>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <h1 style={{ fontSize: '28px', color: '#1a1a1a' }}>Ingerir Documento</h1>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
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

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <div>
            <label htmlFor="title" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Título do Documento *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>

          <div>
            <label htmlFor="author" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Autor
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <div>
            <label htmlFor="year" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Ano
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>

          <div>
            <label htmlFor="sourceType" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Tipo de Fonte
            </label>
            <select
              id="sourceType"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              <option value="book">Livro</option>
              <option value="article">Artigo</option>
              <option value="manuscript">Manuscrito</option>
              <option value="clinical_notes">Notas Clínicas</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="executionProfile" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Perfil de Execução
            </label>
            <select
              id="executionProfile"
              value={executionProfile}
              onChange={(e) => setExecutionProfile(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              <option value="p0-txt-basic-v1">Texto Básico (TXT)</option>
              <option value="p0-pdf-text-v1">PDF com Texto</option>
              <option value="p0-kindle-text-v1">Kindle</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="text" style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px',
          }}>
            Texto do Documento *
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={15}
            placeholder="Cole o texto completo do documento aqui..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="notes" style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px',
          }}>
            Notas Adicionais
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              resize: 'vertical',
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            color: '#991b1b',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={processing}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: processing ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing ? 'Processando...' : 'Processar Documento'}
        </button>
      </form>
    </div>
  );
}

export default IngestPage;
