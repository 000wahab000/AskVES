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
// This is the main App component — React renders this first


function RequireAuth({ children } : { children: ReactNode}){
  const location = useLocation()


  const user = localStorage.getItem('askves_user')
  
  if (!user) {
    return <Navigate to="login" state={{from : location}}
    replace />
    }
    return children
  }
  

export default function App() {
  return (
    // BrowserRouter enables navigation between pages without full page reload
    <BrowserRouter>
      <Routes>
        {/* Route = "when URL is /something, show this page" */}
        <Route path="/"           element={<RequireAuth><ChatPage /></RequireAuth>}></Route>
        <Route path="/community"  element={<RequireAuth><CommunityPage /></RequireAuth>} />
        <Route path="/notes"      element={<RequireAuth><NotesMarketplace /></RequireAuth>}   />
        <Route path="/attendance" element={<RequireAuth><AttendanceTracker /></RequireAuth>}  />
        <Route path="/login"      element={<Login />}              />
        <Route path="*" element={<NotFound />} />      </Routes>
    </BrowserRouter>
  )
}