import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface IngestPageProps {
  onBack: () => void;
}

type InputMethod = 'pdf' | 'kindle' | 'url';

function IngestPage({ onBack }: IngestPageProps) {
  const [inputMethod, setInputMethod] = useState<InputMethod>('pdf');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [sourceType, setSourceType] = useState('book');
  const [notes, setNotes] = useState('');
  const [executionProfile, setExecutionProfile] = useState('p0-pdf-text-v1');
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleExtractText = async () => {
    setExtracting(true);
    setError(null);
    setExtractedText('');

    try {
      if (inputMethod === 'pdf' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text-pdf`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao extrair texto do PDF');
        }

        setExtractedText(data.text);
      } else if (inputMethod === 'kindle' && selectedFile) {
        const text = await selectedFile.text();
        setExtractedText(text);
      } else if (inputMethod === 'url' && url) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text-url`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao extrair texto da URL');
        }

        setExtractedText(data.text);
      }
    } catch (err) {
      console.error('Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao extrair texto');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!extractedText) {
      setError('Por favor, extraia o texto primeiro');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-p0`;

      let fileName = undefined;
      if (inputMethod === 'pdf' && selectedFile) {
        fileName = selectedFile.name;
      } else if (inputMethod === 'kindle' && selectedFile) {
        fileName = selectedFile.name;
      } else if (inputMethod === 'url' && url) {
        fileName = url.split('/').pop() || 'url-content.txt';
      }

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
          rawText: extractedText,
          executionProfile,
          notes: notes || undefined,
          fileName: fileName,
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
              setExtractedText('');
              setSelectedFile(null);
              setUrl('');
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

        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '12px',
          }}>
            Método de Entrada *
          </label>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <button
              type="button"
              onClick={() => {
                setInputMethod('pdf');
                setExecutionProfile('p0-pdf-text-v1');
                setSelectedFile(null);
                setUrl('');
                setExtractedText('');
              }}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: inputMethod === 'pdf' ? '#2563eb' : '#ffffff',
                color: inputMethod === 'pdf' ? '#ffffff' : '#374151',
                border: inputMethod === 'pdf' ? '2px solid #2563eb' : '2px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📄 Upload PDF
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMethod('kindle');
                setExecutionProfile('p0-kindle-text-v1');
                setSelectedFile(null);
                setUrl('');
                setExtractedText('');
              }}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: inputMethod === 'kindle' ? '#2563eb' : '#ffffff',
                color: inputMethod === 'kindle' ? '#ffffff' : '#374151',
                border: inputMethod === 'kindle' ? '2px solid #2563eb' : '2px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📚 Arquivo Kindle/TXT
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMethod('url');
                setExecutionProfile('p0-txt-basic-v1');
                setSelectedFile(null);
                setUrl('');
                setExtractedText('');
              }}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: inputMethod === 'url' ? '#2563eb' : '#ffffff',
                color: inputMethod === 'url' ? '#ffffff' : '#374151',
                border: inputMethod === 'url' ? '2px solid #2563eb' : '2px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              🌐 URL
            </button>
          </div>

          {inputMethod === 'pdf' && (
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              />
              {selectedFile && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}>
                  Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          )}

          {inputMethod === 'kindle' && (
            <div>
              <input
                type="file"
                accept=".txt,.mobi,.azw"
                onChange={handleFileSelect}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              />
              {selectedFile && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}>
                  Arquivo selecionado: {selectedFile.name}
                </div>
              )}
            </div>
          )}

          {inputMethod === 'url' && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/artigo"
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            />
          )}

          <button
            type="button"
            onClick={handleExtractText}
            disabled={extracting || (inputMethod !== 'url' && !selectedFile) || (inputMethod === 'url' && !url)}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '500',
              backgroundColor: extracting ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: extracting || (inputMethod !== 'url' && !selectedFile) || (inputMethod === 'url' && !url) ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {extracting ? 'Extraindo texto...' : '🔍 Extrair Texto'}
          </button>

          {extractedText && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Texto Extraído ({extractedText.length.toLocaleString()} caracteres)
              </div>
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {extractedText.substring(0, 500)}...
              </div>
            </div>
          )}
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
          disabled={processing || !extractedText}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: processing || !extractedText ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: processing || !extractedText ? 'not-allowed' : 'pointer',
          }}
        >
          {processing ? 'Processando...' : 'Processar Documento'}
        </button>
        {!extractedText && (
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#9ca3af',
          }}>
            Extraia o texto primeiro para poder processar o documento
          </div>
        )}
      </form>
    </div>
  );
}

export default IngestPage;
