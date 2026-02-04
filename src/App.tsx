import { useState } from 'react'
import HomePage from './components/HomePage'
import InputForm from './components/InputForm'
import ResultScreen from './components/ResultScreen'
import CaseList from './components/CaseList'
import A1Output from './components/A1Output'
import A2Output from './components/A2Output'
import FinalReviewScreen from './components/FinalReviewScreen'
import { supabase } from './lib/supabase'

type Page = 'home' | 'new-case' | 'case-list' | 'a1-output' | 'a2-output' | 'final-review' | 'result'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [caseData, setCaseData] = useState({ description: '', additionalNotes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = (description: string, additionalNotes: string) => {
    setCaseData({ description, additionalNotes })
    setCurrentPage('a1-output')
  }

  const handleA1Continue = () => {
    setCurrentPage('a2-output')
  }

  const handleA2Continue = () => {
    setCurrentPage('final-review')
  }

  const handleFinalConfirm = async (humanReview: string) => {
    setLoading(true)

    const { error } = await supabase
      .from('cases')
      .insert({
        description: caseData.description,
        additional_notes: caseData.additionalNotes || null,
        human_review: humanReview
      })

    setLoading(false)

    if (!error) {
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

      {currentPage === 'a1-output' && (
        <A1Output
          description={caseData.description}
          additionalNotes={caseData.additionalNotes}
          onContinue={handleA1Continue}
          onBack={() => handleNavigate('new-case')}
        />
      )}

      {currentPage === 'a2-output' && (
        <A2Output
          description={caseData.description}
          additionalNotes={caseData.additionalNotes}
          onContinue={handleA2Continue}
          onBack={() => handleNavigate('a1-output')}
        />
      )}

      {currentPage === 'final-review' && (
        <FinalReviewScreen
          description={caseData.description}
          additionalNotes={caseData.additionalNotes}
          onConfirm={handleFinalConfirm}
          onBack={() => handleNavigate('a2-output')}
          loading={loading}
        />
      )}

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
