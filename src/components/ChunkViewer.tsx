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
  };
}

function ChunkViewer({ chunk }: ChunkViewerProps) {
  return (
    <div style={{
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
      }}>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            backgroundColor: chunk.processed ? '#d1fae5' : '#fef3c7',
            color: chunk.processed ? '#065f46' : '#92400e',
            fontWeight: '500',
          }}>
            {chunk.processed ? 'Processado' : 'Pendente'}
          </span>
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
        <div>
          <strong>Hash:</strong> {chunk.text_hash.substring(0, 16)}...
        </div>
        <div>
          <strong>Tamanho:</strong> {chunk.raw_text.length} caracteres
        </div>
      </div>
    </div>
  );
}

export default ChunkViewer;
