// We import BrowserRouter (gives us URL routing), Routes and Route (define each URL path)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigate , useLocation } from 'react-router-dom'
// Import our CSS styling
import './index.css'
import {type ReactNode } from 'react'
// Import only the pages we KEPT
import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'
import { NotesMarketplace } from './pages/NotesMarketplace'
import { AttendanceTracker } from './pages/AttendanceTracker'
import { NotFound } from './pages/NotFound'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
// This is the main App component — React renders this first


function RequireAuth({ children } : { children: ReactNode}){
  const location = useLocation()
  const rawUser = localStorage.getItem('askves_user')
  let userObj = null
  
  if (rawUser) {
    try {
      userObj = JSON.parse(rawUser)
    } catch {
      localStorage.removeItem('askves_user')
    }
  }
  
  if (!userObj) {
    return <Navigate to="/login" state={{from : location}} replace />
  }
  return children
}
  

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route = "when URL is /something, show this page" */}
        <Route path="/login"      element={<Login />}              />
        <Route path="/"           element={<RequireAuth><ChatPage /></RequireAuth>}></Route>
        <Route path="/community"  element={<RequireAuth><CommunityPage /></RequireAuth>} />
        <Route path="/notes"      element={<RequireAuth><NotesMarketplace /></RequireAuth>}   />
        <Route path="/attendance" element={<RequireAuth><AttendanceTracker /></RequireAuth>}  />
        <Route path='/profile'    element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />      </Routes>
    </BrowserRouter>
  )
}