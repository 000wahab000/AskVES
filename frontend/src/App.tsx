import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}