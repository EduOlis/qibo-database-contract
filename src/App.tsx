import { useState } from 'react'
import InputForm from './components/InputForm'
import ResultScreen from './components/ResultScreen'
import { supabase } from './lib/supabase'

function App() {
  const [submitted, setSubmitted] = useState(false)
  const [caseData, setCaseData] = useState({ description: '', additionalNotes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (description: string, additionalNotes: string) => {
    setLoading(true)

    const { error } = await supabase
      .from('cases')
      .insert({
        description,
        additional_notes: additionalNotes || null
      })

    setLoading(false)

    if (!error) {
      setCaseData({ description, additionalNotes })
      setSubmitted(true)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setCaseData({ description: '', additionalNotes: '' })
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {!submitted ? (
        <InputForm onSubmit={handleSubmit} />
      ) : (
        <ResultScreen data={`Descrição: ${caseData.description}\n\nObservações: ${caseData.additionalNotes || 'Nenhuma'}`} onReset={handleReset} />
      )}
      {loading && <div style={{ marginTop: '10px' }}>Processando...</div>}
    </div>
  )
}

export default App
