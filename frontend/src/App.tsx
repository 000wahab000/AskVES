import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import './index.css'
import CommunityPage from './pages/CommunityPage'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
        path="/" element={<ChatPage />} />
        <Route 
        path="/community" element={<CommunityPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}