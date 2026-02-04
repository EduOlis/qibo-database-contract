interface A1OutputProps {
  description: string;
  additionalNotes: string;
  onContinue: () => void;
  onBack: () => void;
}

function A1Output({ description, additionalNotes, onContinue, onBack }: A1OutputProps) {
  const formatTextInParagraphs = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines;
  };

  const descriptionParagraphs = formatTextInParagraphs(description);
  const notesParagraphs = additionalNotes ? formatTextInParagraphs(additionalNotes) : [];

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
          Esta é uma etapa de organização inicial. O texto abaixo foi estruturado em parágrafos, mas nenhuma interpretação ou validação clínica foi realizada.
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
            Descrição do caso:
          </h4>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={index} style={{
                color: '#1f2937',
                lineHeight: '1.8',
                marginBottom: descriptionParagraphs.length - 1 === index ? '0' : '16px',
                fontSize: '15px'
              }}>
                {paragraph}
              </p>
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
              Observações adicionais:
            </h4>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              {notesParagraphs.map((paragraph, index) => (
                <p key={index} style={{
                  color: '#1f2937',
                  lineHeight: '1.8',
                  marginBottom: notesParagraphs.length - 1 === index ? '0' : '16px',
                  fontSize: '15px'
                }}>
                  {paragraph}
                </p>
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