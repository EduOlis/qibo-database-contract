import { useState } from 'react'

interface InputFormProps {
  onSubmit: (description: string, additionalNotes: string) => void
}

function InputForm({ onSubmit }: InputFormProps) {
  const [description, setDescription] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description.trim()) {
      onSubmit(description, additionalNotes)
    }
  }

  return (
    <div>
      <h1>Entrada de Dados</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description">
            Descrição do caso pelo profissional:
          </label>
          <br />
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="additionalNotes">
            Observações adicionais (opcional):
          </label>
          <br />
          <textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Processar caso
        </button>
      </form>
    </div>
  )
}

export default InputForm
