import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'
import { NotesMarketplace } from './pages/NotesMarketplace'
import { PlacementHub } from './pages/PlacementHub'
import { NoticeBoard } from './pages/NoticeBoard'
import { TeacherLocator } from './pages/TeacherLocator'
import { Profile } from './pages/Profile'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main pages */}
        <Route path="/"            element={<ChatPage />} />
        <Route path="/community"   element={<CommunityPage />} />
        <Route path="/notes"       element={<NotesMarketplace />} />
        <Route path="/placements"  element={<PlacementHub />} />
        <Route path="/campus"      element={<NoticeBoard />} />
        <Route path="/teachers"    element={<TeacherLocator />} />
        <Route path="/profile"     element={<Profile />} />

        {/* Catch-all — anything else shows NotFound */}
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}