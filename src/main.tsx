import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('Iniciando aplicativo...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Elemento root não encontrado!')
} else {
  console.log('Elemento root encontrado, renderizando App...')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App renderizado!')
}
