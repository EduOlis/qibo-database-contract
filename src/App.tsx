import { useState } from 'react'
import InputForm from './components/InputForm'
import ResultScreen from './components/ResultScreen'

function App() {
  const [submitted, setSubmitted] = useState(false)
  const [inputData, setInputData] = useState('')

  const handleSubmit = (data: string) => {
    setInputData(data)
    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    setInputData('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {!submitted ? (
        <InputForm onSubmit={handleSubmit} />
      ) : (
        <ResultScreen data={inputData} onReset={handleReset} />
      )}
    </div>
  )
}

export default App
