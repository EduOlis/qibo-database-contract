interface ResultScreenProps {
  data: string
  onReset: () => void
}

function ResultScreen({ data, onReset }: ResultScreenProps) {
  return (
    <div>
      <h1>Resultado</h1>
      <div style={{
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '15px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Dados recebidos:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {data}
        </pre>
      </div>
      <button onClick={onReset} style={{ padding: '10px 20px' }}>
        Nova Entrada
      </button>
    </div>
  )
}

export default ResultScreen
