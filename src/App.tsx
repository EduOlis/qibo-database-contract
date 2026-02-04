import { useState } from 'react'
import HomePage from './components/HomePage'
import InputForm from './components/InputForm'
import ResultScreen from './components/ResultScreen'
import CaseList from './components/CaseList'
import { supabase } from './lib/supabase'

type Page = 'home' | 'new-case' | 'case-list' | 'result'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
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
      setCurrentPage('result')
    }
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleReset = () => {
    setCurrentPage('home')
    setCaseData({ description: '', additionalNotes: '' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}

      {currentPage === 'new-case' && (
        <InputForm onSubmit={handleSubmit} onBack={() => handleNavigate('home')} />
      )}

      {currentPage === 'case-list' && <CaseList onNavigate={handleNavigate} />}

      {currentPage === 'result' && (
        <ResultScreen
          data={`Descrição: ${caseData.description}\n\nObservações: ${caseData.additionalNotes || 'Nenhuma'}`}
          onReset={handleReset}
        />
      )}

      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '8px',
          fontSize: '18px'
        }}>
          Processando...
        </div>
      )}
    </div>
  )
}

export default App
