import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  console.log('App component loaded')
  
  try {
    return <Dashboard />
  } catch (error) {
    console.error('Error in App:', error)
    return <div>Error loading app. Check console.</div>
  }
}

export default App
