import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import './index.css'

import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'
import { NotesMarketplace } from './pages/NotesMarketplace'
import { PlacementHub } from './pages/PlacementHub'
import { NoticeBoard } from './pages/NoticeBoard'
import { TeacherLocator } from './pages/TeacherLocator'
import { Profile } from './pages/Profile'
import { AttendanceTracker } from './pages/AttendanceTracker'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'

// Simple guard — if no user in localStorage, send to /login
function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const user = localStorage.getItem('askves_user')

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — redirect to /login if not logged in */}
        <Route path="/"           element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/community"  element={<RequireAuth><CommunityPage /></RequireAuth>} />
        <Route path="/notes"      element={<RequireAuth><NotesMarketplace /></RequireAuth>} />
        <Route path="/placements" element={<RequireAuth><PlacementHub /></RequireAuth>} />
        <Route path="/campus"     element={<RequireAuth><NoticeBoard /></RequireAuth>} />
        <Route path="/teachers"   element={<RequireAuth><TeacherLocator /></RequireAuth>} />
        <Route path="/attendance" element={<RequireAuth><AttendanceTracker /></RequireAuth>} />
        <Route path="/profile"    element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}