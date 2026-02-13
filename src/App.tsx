import { useState } from 'react'
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

  const handleNavigate = (page: string, params?: PageParams) => {
    setCurrentPage(page as Page)
    setPageParams(params || {})
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
    }}>
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
