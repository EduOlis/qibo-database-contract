import { useState } from 'react';

interface FinalReviewScreenProps {
  description: string;
  additionalNotes: string;
  onConfirm: (humanReview: string) => void;
  onBack: () => void;
  loading?: boolean;
}

interface TextBlock {
  content: string;
  hasDivergentTerms: boolean;
  divergentTermsFound: string[];
}

function FinalReviewScreen({ description, additionalNotes, onConfirm, onBack, loading }: FinalReviewScreenProps) {
  const [humanReview, setHumanReview] = useState('');
  const [showError, setShowError] = useState(false);

  const divergentTerms = [
    'mas',
    'porém',
    'entretanto',
    'no entanto',
    'todavia',
    'contudo',
    'diferente',
    'divergente',
    'ao contrário',
    'por outro lado',
    'alternativamente',
    'embora',
    'apesar',
    'versus',
    'vs',
    'ou',
    'talvez',
    'possivelmente',
    'aparentemente',
    'supostamente',
    'não está claro',
    'indefinido',
    'conflitante',
    'contraditório',
    'inconsistente'
  ];

  const analyzeText = (text: string): TextBlock[] => {
    const paragraphs = text.split('\n').filter(line => line.trim().length > 0);
    const blocks: TextBlock[] = [];

    for (const paragraph of paragraphs) {
      const lowerParagraph = paragraph.toLowerCase();
      const foundTerms: string[] = [];

      for (const term of divergentTerms) {
        if (lowerParagraph.includes(term)) {
          foundTerms.push(term);
        }
      }

      blocks.push({
        content: paragraph,
        hasDivergentTerms: foundTerms.length > 0,
        divergentTermsFound: foundTerms
      });
    }

    return blocks;
  };

  const descriptionBlocks = analyzeText(description);
  const notesBlocks = additionalNotes ? analyzeText(additionalNotes) : [];
  const allBlocks = [...descriptionBlocks, ...notesBlocks];
  const blocksWithDivergence = allBlocks.filter(b => b.hasDivergentTerms);

  const handleConfirm = () => {
    if (humanReview.trim().length === 0) {
      setShowError(true);
      return;
    }
    onConfirm(humanReview);
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '20px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0
          }}>
            REVISÃO HUMANA OBRIGATÓRIA
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          margin: 0,
          fontWeight: '500',
          lineHeight: '1.5'
        }}>
          Nenhuma interpretação clínica foi realizada pelo sistema
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#92400e',
              margin: 0
            }}>
              Resumo da Organização Textual (A2)
            </h2>
          </div>
        </div>

        {blocksWithDivergence.length > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                <path d="M12 8v4m0 4h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#991b1b'
              }}>
                {blocksWithDivergence.length} bloco(s) com possíveis tensões textuais detectadas
              </span>
            </div>
          </div>
        )}

        {blocksWithDivergence.length === 0 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2"/>
                <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#166534'
              }}>
                Nenhuma tensão textual detectada
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Descrição do caso:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {descriptionBlocks.map((block, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: block.hasDivergentTerms ? '#fef2f2' : '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: block.hasDivergentTerms ? '2px solid #fca5a5' : '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              >
                <p style={{
                  color: '#1f2937',
                  lineHeight: '1.6',
                  marginBottom: block.hasDivergentTerms ? '10px' : '0',
                  margin: 0
                }}>
                  {block.content}
                </p>
                {block.hasDivergentTerms && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #fecaca'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#991b1b',
                      fontWeight: '500'
                    }}>
                      Termos detectados:
                    </span>
                    {block.divergentTermsFound.map((term, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}
                      >
                        "{term}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {additionalNotes && notesBlocks.length > 0 && (
          <div>
            <h4 style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Observações adicionais:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notesBlocks.map((block, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: block.hasDivergentTerms ? '#fef2f2' : '#f9fafb',
                    padding: '12px',
                    borderRadius: '6px',
                    border: block.hasDivergentTerms ? '2px solid #fca5a5' : '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.6',
                    marginBottom: block.hasDivergentTerms ? '10px' : '0',
                    margin: 0
                  }}>
                    {block.content}
                  </p>
                  {block.hasDivergentTerms && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #fecaca'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#991b1b',
                        fontWeight: '500'
                      }}>
                        Termos detectados:
                      </span>
                      {block.divergentTermsFound.map((term, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          "{term}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#eff6ff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <label style={{
          display: 'block',
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e40af',
          marginBottom: '12px'
        }}>
          <span style={{ color: '#dc2626' }}>*</span> Análise e decisão do profissional humano
        </label>
        <textarea
          value={humanReview}
          onChange={(e) => {
            setHumanReview(e.target.value);
            if (showError && e.target.value.trim().length > 0) {
              setShowError(false);
            }
          }}
          placeholder="Insira sua análise clínica, decisão e justificativa..."
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '14px',
            fontSize: '15px',
            border: showError ? '2px solid #dc2626' : '2px solid #3b82f6',
            borderRadius: '6px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            resize: 'vertical',
            lineHeight: '1.6',
            boxSizing: 'border-box'
          }}
        />
        {showError && (
          <p style={{
            color: '#dc2626',
            fontSize: '14px',
            marginTop: '8px',
            marginBottom: 0,
            fontWeight: '500'
          }}>
            Este campo é obrigatório. A revisão humana deve ser registrada antes de prosseguir.
          </p>
        )}
        <p style={{
          fontSize: '13px',
          color: '#1e40af',
          marginTop: '10px',
          marginBottom: 0,
          fontStyle: 'italic'
        }}>
          Este campo é obrigatório e deve conter sua interpretação profissional, decisão clínica e justificativa.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onBack}
          type="button"
          disabled={loading}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: loading ? '#d1d5db' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#4b5563')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6b7280')}
        >
          Voltar para A2
        </button>

        <button
          onClick={handleConfirm}
          type="button"
          disabled={loading}
          style={{
            padding: '14px 40px',
            fontSize: '16px',
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          {loading ? 'Salvando...' : 'Confirmar revisão humana'}
        </button>
      </div>
    </div>
  );
}

export default FinalReviewScreen;