import { useState, useEffect } from 'react';

interface A1OutputProps {
  description: string;
  additionalNotes: string;
  onContinue: () => void;
  onBack: () => void;
}

interface A1Block {
  id: string;
  text: string;
  aspect: string;
}

interface AuditInfo {
  agent_name: string;
  agent_model: string;
  agent_version: string;
  contract_version: string;
  execution_time_ms: number;
  input_length: number;
  output_blocks_count: number;
  warning?: string;
}

function A1Output({ description, additionalNotes, onContinue, onBack }: A1OutputProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionBlocks, setDescriptionBlocks] = useState<A1Block[]>([]);
  const [notesBlocks, setNotesBlocks] = useState<A1Block[]>([]);
  const [auditInfo, setAuditInfo] = useState<AuditInfo | null>(null);

  useEffect(() => {
    processWithA1();
  }, [description, additionalNotes]);

  const processWithA1 = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-a1`;

      const descResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: description,
          prefix: 'A1-DESC'
        })
      });

      if (!descResponse.ok) {
        const errorData = await descResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Erro ao processar descrição';
        throw new Error(errorMessage);
      }

      const descData = await descResponse.json();

      if (descData.error) {
        throw new Error(descData.error);
      }

      setDescriptionBlocks(descData.blocks);
      setAuditInfo(descData.audit);

      if (additionalNotes && additionalNotes.trim()) {
        const notesResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            text: additionalNotes,
            prefix: 'A1-NOTA'
          })
        });

        if (!notesResponse.ok) {
          const errorData = await notesResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.details || 'Erro ao processar observações';
          throw new Error(errorMessage);
        }

        const notesData = await notesResponse.json();

        if (notesData.error) {
          throw new Error(notesData.error);
        }

        setNotesBlocks(notesData.blocks);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro no processamento A1:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '900px',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '40px',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          <div style={{
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Processando com Agente A1...
          </div>
          <div style={{
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Organizando texto em blocos temáticos conservadores
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '900px',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#dc2626', marginTop: 0 }}>Erro no processamento</h3>
          <p style={{ color: '#991b1b', marginBottom: 0 }}>{error}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Voltar
          </button>
          <button
            onClick={processWithA1}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#92400e',
            margin: 0
          }}>
            Output intermediário — A1 (não validado clinicamente)
          </h2>
        </div>
        <p style={{
          fontSize: '14px',
          color: '#92400e',
          margin: 0
        }}>
          Organização conservadora por LLM. Texto reestruturado em blocos temáticos. Nenhuma inferência clínica foi realizada.
        </p>
      </div>

      {auditInfo && (
        <div style={{
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '24px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#4b5563'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Agente:</strong> {auditInfo.agent_name} ({auditInfo.agent_model}) — {auditInfo.contract_version}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Execução:</strong> {auditInfo.execution_time_ms}ms | {auditInfo.output_blocks_count} blocos gerados
          </div>
          {auditInfo.warning && (
            <div style={{ color: '#d97706', marginTop: '8px' }}>
              ⚠️ {auditInfo.warning}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          A1 — Organização Inicial
        </h3>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Descrição do caso — Estruturação A1:
          </h4>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            {descriptionBlocks.map((block, index) => (
              <div key={block.id} style={{
                marginBottom: descriptionBlocks.length - 1 === index ? '0' : '20px',
                paddingBottom: descriptionBlocks.length - 1 === index ? '0' : '20px',
                borderBottom: descriptionBlocks.length - 1 === index ? 'none' : '2px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    minWidth: '110px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    {block.id}
                  </div>
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    fontFamily: 'monospace',
                    flexShrink: 0
                  }}>
                    {block.aspect}
                  </div>
                </div>
                <p style={{
                  color: '#1f2937',
                  lineHeight: '1.8',
                  margin: 0,
                  fontSize: '15px',
                  paddingLeft: '122px'
                }}>
                  {block.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {additionalNotes && notesBlocks.length > 0 && (
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Observações adicionais — Estruturação A1:
            </h4>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              {notesBlocks.map((block, index) => (
                <div key={block.id} style={{
                  marginBottom: notesBlocks.length - 1 === index ? '0' : '20px',
                  paddingBottom: notesBlocks.length - 1 === index ? '0' : '20px',
                  borderBottom: notesBlocks.length - 1 === index ? 'none' : '2px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                      minWidth: '110px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      {block.id}
                    </div>
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      fontFamily: 'monospace',
                      flexShrink: 0
                    }}>
                      {block.aspect}
                    </div>
                  </div>
                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.8',
                    margin: 0,
                    fontSize: '15px',
                    paddingLeft: '122px'
                  }}>
                    {block.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onBack}
          type="button"
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
        >
          Voltar
        </button>

        <button
          onClick={onContinue}
          type="button"
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Continuar para próxima etapa
        </button>
      </div>
    </div>
  );
}

export default A1Output;