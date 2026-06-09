// We import BrowserRouter (gives us URL routing), Routes and Route (define each URL path)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigate , useLocation } from 'react-router-dom'
// Import our CSS styling
import './index.css'
import {type ReactNode } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
// Import only the pages we KEPT
import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'
import { NotesMarketplace } from './pages/NotesMarketplace'
import { AttendanceTracker } from './pages/AttendanceTracker'
import { NotFound } from './pages/NotFound'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { NoticeBoard } from './pages/NoticeBoard'
import { LandingPage } from './pages/LandingPage'
// This is the main App component — React renders this first


import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function RequireAuth({ children } : { children: ReactNode}){
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (checking) return null   // brief loading — avoids flash redirect
  if (!authed) return <Navigate to="/login" state={{from : location}} replace />
  return children
}
  

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Route = "when URL is /something, show this page" */}
          <Route path="/login"      element={<Login />}              />
          <Route path="/"        element={<LandingPage />} />
          <Route path="/chat"       element={<RequireAuth><ChatPage />          </RequireAuth>} />
          <Route path="/community"  element={<RequireAuth><CommunityPage />     </RequireAuth>} />
          <Route path="/notes"      element={<RequireAuth><NotesMarketplace />  </RequireAuth>} />
          <Route path="/attendance" element={<RequireAuth><AttendanceTracker /> </RequireAuth>} />
          <Route path='/profile'    element={<RequireAuth><Profile />           </RequireAuth>} />
          <Route path='/notice'     element={<RequireAuth><NoticeBoard />       </RequireAuth>} />
          <Route path="*"           element={<NotFound />} /></Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}