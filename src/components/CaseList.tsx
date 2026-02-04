import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Case {
  id: string;
  description: string;
  additional_notes: string | null;
  created_at: string;
}

interface CaseListProps {
  onNavigate: (page: string) => void;
}

function CaseList({ onNavigate }: CaseListProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCases(data);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '28px', color: '#1a1a1a' }}>Casos Anteriores</h1>
        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '10px 20px',
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
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Carregando casos...
        </div>
      ) : cases.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Nenhum caso encontrado</p>
          <button
            onClick={() => onNavigate('new-case')}
            style={{
              marginTop: '20px',
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
            Criar Primeiro Caso
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {new Date(caseItem.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Descrição:
                </h3>
                <p style={{
                  color: '#1f2937',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {caseItem.description}
                </p>
              </div>

              {caseItem.additional_notes && (
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Observações:
                  </h3>
                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {caseItem.additional_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CaseList;