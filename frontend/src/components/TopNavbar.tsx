import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Chat',       path: '/' },
  { label: 'Community',  path: '/community' },
  { label: 'Notes',      path: '/notes' },
  { label: 'Campus',     path: '/campus' },
  { label: 'Placements', path: '/placements' },
]

export function TopNavbar() {
  const { pathname } = useLocation()

  return (
    <nav 
    className="top-navbar"
    >
      <div 
      className="navbar-logo"
      >
        <span 
        style={{ 
          fontFamily: 'Space Grotesk', 
          fontWeight: 700, 
          fontSize: '20px', 
          color: '#e8edf8' 

          }}>
          AskVES
        </span>

        <span 
        className="ai-badge"

        >
        AI Campus Assistant
        </span>

      </div>

      <div 
      className="navbar-links"
      >
        {NAV.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link${pathname === path ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div 
      className="navbar-right">
        <span 
        className="powered-by-text"
        >
          Powered by Groq + Gemini
          </span>
        <button 
        className="login-btn"
        >
          Login
          </button>
      </div>
    </nav>
  )
}
