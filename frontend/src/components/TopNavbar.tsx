import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut, SUPABASE_CONFIGURED } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const NAV = [
  { label: 'Chat',       path: '/'            },
  { label: 'Community',  path: '/community'   },
  { label: 'Notes',      path: '/notes'       },
  { label: 'Campus',     path: '/campus'      },
  { label: 'Placements', path: '/placements'  },
  { label: 'Teachers',   path: '/teachers'    },
  { label: 'Attendance', path: '/attendance'  },
  { label: 'Profile',    path: '/profile'     },
]

export function TopNavbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null)

  useEffect(() => {
    if (!supabase || !SUPABASE_CONFIGURED) return  // no Supabase — skip

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user
        setUser({
          name: u.user_metadata?.full_name ?? u.email?.split('@')[0],
          email: u.email,
          picture: u.user_metadata?.avatar_url,
        })
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          name: u.user_metadata?.full_name ?? u.email?.split('@')[0],
          email: u.email,
          picture: u.user_metadata?.avatar_url,
        })
      } else {
        setUser(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="top-navbar">
      <div className="navbar-logo">
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '20px', color: '#dce8f5' }}>
          AskVES
        </span>
        <span className="ai-badge">AI Campus Assistant</span>
      </div>

      <div className="navbar-links">
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

      <div className="navbar-right">
        <span className="powered-by-text">Powered by Groq + Gemini</span>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* User chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(200,57,10,0.12)',
                border: '1px solid rgba(200,57,10,0.25)',
                borderRadius: '999px',
                padding: '5px 12px',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#1a7fa8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontFamily: 'Space Grotesk',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.name?.[0] ?? 'U'}
              </div>
              <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#dce8f5', fontWeight: 500 }}>
                {user.name ?? user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="login-btn"
              style={{ backgroundColor: 'transparent', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login">
            <button className="login-btn">Login</button>
          </Link>
        )}
      </div>
    </nav>
  )
}

