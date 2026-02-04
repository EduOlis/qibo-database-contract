import { useState } from 'react'

interface InputFormProps {
  onSubmit: (data: string) => void
}

function InputForm({ onSubmit }: InputFormProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input)
    }
  }

  return (
    <div>
      <h1>Entrada de Dados</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="input">
            Texto:
          </label>
          <br />
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            cols={50}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Processar
        </button>
      </form>
    </div>
  )
}

export default InputForm
