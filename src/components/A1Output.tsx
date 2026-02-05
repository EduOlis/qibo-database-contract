interface A1OutputProps {
  description: string;
  additionalNotes: string;
  onContinue: () => void;
  onBack: () => void;
}

interface TextBlock {
  id: string;
  text: string;
  type: 'paragraph' | 'sentence';
}

function A1Output({ description, additionalNotes, onContinue, onBack }: A1OutputProps) {
  const structureText = (text: string, prefix: string): TextBlock[] => {
    const blocks: TextBlock[] = [];
    let blockCounter = 1;

    const paragraphs = text.split('\n').filter(line => line.trim().length > 0);

    paragraphs.forEach((paragraph) => {
      const sentences = paragraph
        .split(/([.!?]+\s+)/)
        .reduce<string[]>((acc, part, idx, arr) => {
          if (idx % 2 === 0 && part.trim()) {
            const nextPart = arr[idx + 1] || '';
            acc.push((part + nextPart).trim());
          }
          return acc;
        }, [])
        .filter(s => s.length > 0);

      if (sentences.length === 0 && paragraph.trim()) {
        blocks.push({
          id: `${prefix}-BLOCO-${String(blockCounter).padStart(2, '0')}`,
          text: paragraph.trim(),
          type: 'paragraph'
        });
        blockCounter++;
      } else if (sentences.length === 1) {
        blocks.push({
          id: `${prefix}-BLOCO-${String(blockCounter).padStart(2, '0')}`,
          text: sentences[0],
          type: 'paragraph'
        });
        blockCounter++;
      } else {
        sentences.forEach((sentence) => {
          blocks.push({
            id: `${prefix}-BLOCO-${String(blockCounter).padStart(2, '0')}`,
            text: sentence,
            type: 'sentence'
          });
          blockCounter++;
        });
      }
    });

    return blocks;
  };

  const descriptionBlocks = structureText(description, 'A1-DESC');
  const notesBlocks = additionalNotes ? structureText(additionalNotes, 'A1-NOTA') : [];

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
          Esta é uma etapa de organização formal. O texto foi reestruturado em unidades rastreáveis numeradas. Nenhuma palavra foi alterada, interpretada ou validada clinicamente.
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
                marginBottom: descriptionBlocks.length - 1 === index ? '0' : '16px',
                paddingBottom: descriptionBlocks.length - 1 === index ? '0' : '16px',
                borderBottom: descriptionBlocks.length - 1 === index ? 'none' : '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
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
                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.8',
                    margin: 0,
                    fontSize: '15px',
                    flex: 1
                  }}>
                    {block.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {additionalNotes && (
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
                  marginBottom: notesBlocks.length - 1 === index ? '0' : '16px',
                  paddingBottom: notesBlocks.length - 1 === index ? '0' : '16px',
                  borderBottom: notesBlocks.length - 1 === index ? 'none' : '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
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
                    <p style={{
                      color: '#1f2937',
                      lineHeight: '1.8',
                      margin: 0,
                      fontSize: '15px',
                      flex: 1
                    }}>
                      {block.text}
                    </p>
                  </div>
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