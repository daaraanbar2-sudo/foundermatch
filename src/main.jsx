import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ChessAssistant from './chess/ChessAssistant.jsx'

const isChessRoute = window.location.pathname.startsWith('/chess')

createRoot(document.getElementById('root')).render(
  isChessRoute ? <ChessAssistant /> : <App />
)