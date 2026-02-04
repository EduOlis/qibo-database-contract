import { useState } from 'react'

interface InputFormProps {
  onSubmit: (description: string, additionalNotes: string) => void;
  onBack: () => void;
}

function InputForm({ onSubmit, onBack }: InputFormProps) {
  const [description, setDescription] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description.trim()) {
      onSubmit(description, additionalNotes)
    }
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '28px', color: '#1a1a1a' }}>Novo Caso</h1>
        <button
          onClick={onBack}
          type="button"
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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="description"
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}
          >
            Descrição do caso pelo profissional:
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="additionalNotes"
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}
          >
            Observações adicionais (opcional):
          </label>
          <textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
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
          Processar caso
        </button>
      </form>
    </div>
  )
}

export default InputForm
