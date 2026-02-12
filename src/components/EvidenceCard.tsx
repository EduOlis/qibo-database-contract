interface EvidenceCardProps {
  evidence: {
    id: string;
    excerpt_text: string;
    suggested_entity_type: string;
    relevance_score: number;
    justification: string;
    status: string;
    page_reference?: string;
    reviewed_by?: string;
    reviewed_at?: string;
  };
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

const entityTypeColors: Record<string, { bg: string; text: string }> = {
  symptom: { bg: '#fef3c7', text: '#92400e' },
  syndrome: { bg: '#ddd6fe', text: '#5b21b6' },
  clinical_sign: { bg: '#d1fae5', text: '#065f46' },
  acupoint: { bg: '#dbeafe', text: '#1e40af' },
  therapeutic_principle: { bg: '#fed7aa', text: '#9a3412' },
  other: { bg: '#f3f4f6', text: '#374151' },
};

function EvidenceCard({ evidence, onApprove, onReject, showActions = false }: EvidenceCardProps) {
  const typeColor = entityTypeColors[evidence.suggested_entity_type] || entityTypeColors.other;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '12px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: typeColor.bg,
          color: typeColor.text,
          fontWeight: '600',
          textTransform: 'capitalize',
        }}>
          {evidence.suggested_entity_type.replace('_', ' ')}
        </span>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: evidence.status === 'approved' ? '#d1fae5' : evidence.status === 'rejected' ? '#fee2e2' : '#fef3c7',
            color: evidence.status === 'approved' ? '#065f46' : evidence.status === 'rejected' ? '#991b1b' : '#92400e',
            fontWeight: '500',
          }}>
            {evidence.status === 'approved' ? 'Aprovado' : evidence.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
          </span>

          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: evidence.relevance_score >= 0.7 ? '#059669' : evidence.relevance_score >= 0.4 ? '#d97706' : '#dc2626',
          }}>
            {(evidence.relevance_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '14px',
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        lineHeight: '1.7',
        color: '#111827',
        marginBottom: '12px',
      }}>
        {evidence.excerpt_text}
      </div>

      {evidence.justification && (
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '12px',
          lineHeight: '1.5',
        }}>
          <strong style={{ color: '#374151' }}>Justificativa:</strong> {evidence.justification}
        </div>
      )}

      {evidence.page_reference && (
        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
          Referência: {evidence.page_reference}
        </div>
      )}

      {showActions && evidence.status === 'pending' && (onApprove || onReject) && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {onApprove && (
            <button
              onClick={() => onApprove(evidence.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Aprovar
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(evidence.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Rejeitar
            </button>
          )}
        </div>
      )}

      {evidence.reviewed_at && (
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '12px',
          fontStyle: 'italic',
        }}>
          Revisado em {new Date(evidence.reviewed_at).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}

export default EvidenceCard;
