interface A2OutputProps {
  description: string;
  additionalNotes: string;
  onContinue: () => void;
  onBack: () => void;
}

interface TextBlock {
  content: string;
  hasDivergentTerms: boolean;
  divergentTermsFound: string[];
}

function A2Output({ description, additionalNotes, onContinue, onBack }: A2OutputProps) {
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
            Organização textual para revisão humana (A2)
          </h2>
        </div>
        <p style={{
          fontSize: '14px',
          color: '#92400e',
          margin: 0
        }}>
          Esta etapa identifica possíveis tensões textuais. Nenhuma interpretação, resolução de conflitos ou hipótese clínica foi gerada.
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          A2 — Organização de Tensões Textuais
        </h3>

        {blocksWithDivergence.length > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
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
            <p style={{
              fontSize: '14px',
              color: '#991b1b',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Os blocos abaixo contêm termos que podem indicar informações divergentes ou contraditórias.
              Esta é apenas uma organização textual, sem interpretação clínica.
            </p>
          </div>
        )}

        {blocksWithDivergence.length === 0 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
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
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Descrição do caso:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {descriptionBlocks.map((block, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: block.hasDivergentTerms ? '#fef2f2' : '#f9fafb',
                  padding: '16px',
                  borderRadius: '6px',
                  border: block.hasDivergentTerms ? '2px solid #fca5a5' : '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  color: '#1f2937',
                  lineHeight: '1.8',
                  marginBottom: block.hasDivergentTerms ? '12px' : '0',
                  fontSize: '15px'
                }}>
                  {block.content}
                </p>
                {block.hasDivergentTerms && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #fecaca'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#991b1b',
                      fontWeight: '500'
                    }}>
                      Termos detectados:
                    </span>
                    {block.divergentTermsFound.map((term, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '12px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          padding: '4px 8px',
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
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Observações adicionais:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notesBlocks.map((block, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: block.hasDivergentTerms ? '#fef2f2' : '#f9fafb',
                    padding: '16px',
                    borderRadius: '6px',
                    border: block.hasDivergentTerms ? '2px solid #fca5a5' : '1px solid #e5e7eb'
                  }}
                >
                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.8',
                    marginBottom: block.hasDivergentTerms ? '12px' : '0',
                    fontSize: '15px'
                  }}>
                    {block.content}
                  </p>
                  {block.hasDivergentTerms && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid #fecaca'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        color: '#991b1b',
                        fontWeight: '500'
                      }}>
                        Termos detectados:
                      </span>
                      {block.divergentTermsFound.map((term, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            padding: '4px 8px',
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
          Voltar para A1
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

export default A2Output;