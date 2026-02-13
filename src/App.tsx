import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import IngestPage from './components/IngestPage'
import DocumentsPage from './components/DocumentsPage'
import ChunksPage from './components/ChunksPage'
import EvidencesPage from './components/EvidencesPage'
import ValidationPage from './components/ValidationPage'

type Page = 'dashboard' | 'ingest' | 'documents' | 'chunks' | 'evidences' | 'validate' | 'audit'

interface PageParams {
  sourceId?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [pageParams, setPageParams] = useState<PageParams>({})

  useEffect(() => {
    console.log('App component mounted')
    console.log('Environment variables:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
    })
  }, [])

  const handleNavigate = (page: string, params?: PageParams) => {
    setCurrentPage(page as Page)
    setPageParams(params || {})
  }

  console.log('Rendering App component, current page:', currentPage)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      width: '100%',
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        margin: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ color: '#1a1a1a', marginBottom: '10px' }}>Sistema Funcionando</h1>
        <p style={{ color: '#6b7280' }}>Página atual: {currentPage}</p>
      </div>

      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}

      {currentPage === 'ingest' && (
        <IngestPage onBack={() => handleNavigate('dashboard')} />
      )}

      {currentPage === 'documents' && (
        <DocumentsPage onNavigate={handleNavigate} />
      )}

      {currentPage === 'chunks' && (
        <ChunksPage
          sourceId={pageParams.sourceId}
          onBack={() => handleNavigate('documents')}
        />
      )}

      {currentPage === 'evidences' && (
        <EvidencesPage
          sourceId={pageParams.sourceId}
          onBack={() => handleNavigate('documents')}
        />
      )}

      {currentPage === 'validate' && (
        <ValidationPage />
      )}

      {currentPage === 'audit' && (
        <div style={{
          maxWidth: '1400px',
          margin: '40px auto',
          padding: '0 24px',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '32px', color: '#1a1a1a', marginBottom: '16px' }}>
            Auditoria e Rastreabilidade
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            Funcionalidade em desenvolvimento
          </p>
        </div>
      )}
    </div>
  )
}

export default App
