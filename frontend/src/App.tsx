// We import BrowserRouter (gives us URL routing), Routes and Route (define each URL path)
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Import our CSS styling
import './index.css'

// Import only the pages we KEPT
import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'
import { NotesMarketplace } from './pages/NotesMarketplace'
import { AttendanceTracker } from './pages/AttendanceTracker'
import { NotFound } from './pages/NotFound'
// This is the main App component — React renders this first
export default function App() {
  return (
    // BrowserRouter enables navigation between pages without full page reload
    <BrowserRouter>
      <Routes>
        {/* Route = "when URL is /something, show this page" */}
        <Route path="/"           element={<ChatPage           />} />
        <Route path="/community"  element={<CommunityPage      />} />
        <Route path="/notes"      element={<NotesMarketplace   />} />
        <Route path="/attendance" element={<AttendanceTracker  />} />
        <Route path="*"           element={<NotFound           />} />
      </Routes>
    </BrowserRouter>
  )
}