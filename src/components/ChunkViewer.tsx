interface ChunkViewerProps {
  chunk: {
    id: string;
    raw_text: string;
    text_hash: string;
    sequence_number: number;
    language: string;
    page_reference?: string;
    processed: boolean;
    created_at: string;
    relevance_score?: number;
    skip_processing?: boolean;
  };
  onToggleSkip?: (chunkId: string, currentValue: boolean) => void;
  isSelected?: boolean;
  onToggleSelection?: (chunkId: string) => void;
}

function ChunkViewer({ chunk, onToggleSkip, isSelected, onToggleSelection }: ChunkViewerProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 0.65) return { bg: '#d1fae5', text: '#065f46', label: 'Alta' };
    if (score >= 0.35) return { bg: '#fef3c7', text: '#92400e', label: 'Média' };
    return { bg: '#fee2e2', text: '#991b1b', label: 'Baixa' };
  };

  const relevanceScore = chunk.relevance_score || 0;
  const relevanceInfo = getRelevanceColor(relevanceScore);
  return (
    <div style={{
      backgroundColor: isSelected ? '#ede9fe' : '#f9fafb',
      border: isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!chunk.processed && onToggleSelection && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelection(chunk.id)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#6366f1',
              }}
            />
          )}
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Chunk #{chunk.sequence_number}
            </div>
            {chunk.page_reference && (
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Referência: {chunk.page_reference}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: relevanceInfo.bg,
            color: relevanceInfo.text,
            fontWeight: '600',
          }}>
            {relevanceInfo.label} ({Math.round(relevanceScore * 100)}%)
          </span>
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            fontWeight: '500',
          }}>
            {chunk.language.toUpperCase()}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: chunk.processed ? '#d1fae5' : chunk.skip_processing ? '#e5e7eb' : '#fef3c7',
            color: chunk.processed ? '#065f46' : chunk.skip_processing ? '#6b7280' : '#92400e',
            fontWeight: '500',
          }}>
            {chunk.processed ? 'Processado' : chunk.skip_processing ? 'Pulado' : 'Pendente'}
          </span>
          {!chunk.processed && onToggleSkip && (
            <button
              onClick={() => onToggleSkip(chunk.id, chunk.skip_processing || false)}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {chunk.skip_processing ? 'Desmarcar' : 'Pular'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#1f2937',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '300px',
        overflowY: 'auto',
      }}>
        {chunk.raw_text}
      </div>

      <div style={{
        marginTop: '12px',
        display: 'flex',
        gap: '16px',
        fontSize: '11px',
        color: '#6b7280',
      }}>
        {chunk.text_hash && (
          <div>
            <strong>Hash:</strong> {chunk.text_hash.substring(0, 16)}...
          </div>
        )}
        <div>
          <strong>Tamanho:</strong> {chunk.raw_text?.length || 0} caracteres
        </div>
      </div>
    </div>
  );
}

export default ChunkViewer;
