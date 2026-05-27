import { Link } from 'react-router-dom'
import { Utensils, Calendar, Users, Printer, CupSoda } from 'lucide-react'
import { TopNavbar }    from '../components/TopNavbar'
import { MobileTabBar } from '../components/MobileTabBar'
import { ChatWindow }   from '../components/ChatWindow'
import { NOTICES, categoryColor } from '../data/notices'

const FEATURES = [
  { Icon: Utensils, label: 'Canteen',   desc: 'Menu & prices' },
  { Icon: Users,    label: 'Teachers',  desc: 'Real-time location' },
  { Icon: Calendar, label: 'Events',    desc: 'Campus activities' },
  { Icon: Printer,  label: 'Xerox',     desc: 'Shop comparison' },
  { Icon: CupSoda,  label: 'Vending',   desc: '24/7 availability' },
  { Icon: Users,    label: 'Community', desc: 'Discussion board' },
]

export default function ChatPage() {
  return (
    <div className="page-shell">
      <TopNavbar />
      <div className="chat-layout">

        {/* LEFT INFO PANEL */}
        <div className="info-panel">

          {/* Card 1 — What it can do */}
          <div className="card">
            <h2 style={{ 
              fontFamily: 'Space Grotesk', 
              fontWeight: 600, 
              fontSize: '22px', 
              color: '#dce8f5', 
              marginBottom: '12px' }}>
              Unofficial AI Assistant for VESIT Students
            </h2>
            <div className="disclaimer-badge">
              Not affiliated with or endorsed by VESIT
            </div>
            <div className="divider" />
            <h3 style={{ 
              fontFamily: 'Space Grotesk', 
              fontWeight: 500, 
              fontSize: '15px', 
              color: '#7a9bbf', 
              marginBottom: '14px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em' 
              }}>
              What It Can Do
            </h3>
            <div className="feature-grid">
              {FEATURES.map(({ Icon, label, desc }) => (
                <div key={label} className="feature-card">
                  <div style={{ 
                    color: '#1a7fa8', 
                    marginBottom: '8px' 
                    }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div 
                  style={{ 
                    fontFamily: 'DM Sans', 
                    fontWeight: 500, 
                    fontSize: '14px', 
                    color: '#dce8f5', 
                    marginBottom: '3px' 
                    }}>
                    {label}
                  </div>
                  <div style={{ 
                    fontFamily: 'DM Sans', 
                    fontSize: '12px', 
                    color: '#7a9bbf' 
                    }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Card 1 ends here */}

          {/* Card 2 — Powered by */}
          <div className="card" style={{ 
            padding: '16px 20px' 
            }}>
            <div 
            style={{ 
              fontFamily: 'Space Grotesk', 
              fontWeight: 500, 
              fontSize: '14px', 
              color: '#dce8f5', 
              marginBottom: '4px' 
              }}>
              Powered by AI + Structured Data
            </div>
            <div 
            style={{ 
              fontFamily: 'DM Sans', 
              fontSize: '12px', 
              color: '#7a9bbf', 
              marginBottom: '4px' 
              }}>
              Built with Groq, Gemini, Supabase &amp; Python
            </div>
            <div 
            style={{ 
              fontFamily: 'DM Sans', 
              fontSize: '11px', 
              color: '#3d5a7a' 
              }}>
              Built at UniMerge 2026
            </div>
          </div>
          {/* Card 2 ends here */}

          {/* Card 3 — Latest Notices */}
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '16px' 
              }}>
              <h3 style={{ 
                fontFamily: 'Space Grotesk', 
                fontWeight: 600, 
                fontSize: '15px', 
                color: 'var(--t1)' 
                }}>
                📋 Latest Notices
              </h3>
              <Link to="/campus" 
              style={{ 
                fontFamily: 'DM Sans', 
                fontSize: '12px', 
                color: 'var(--accent)', 
                textDecoration: 'none' 
                }}>
                View all →
              </Link>
            </div>
            <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
              }}>
              {NOTICES.slice(0, 3).map((notice) => (
                <div key={notice.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '10px', 
                  paddingBottom: '10px', 
                  borderBottom: '1px solid var(--border)' 
                  }}>
                  <div 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: categoryColor(notice.category), 
                    flexShrink: 0, 
                    marginTop: '5px' 
                    }} />
                  <div>
                    <p 
                    style={{ 
                      fontFamily: 'DM Sans', 
                      fontSize: '13px', 
                      color: 'var(--t1)', 
                      marginBottom: '2px', 
                      lineHeight: 1.4 
                      }}>
                      {notice.title}
                    </p>
                    <p 
                    style={{ 
                      fontFamily: 'DM Sans', 
                      fontSize: '11px', 
                      color: 'var(--t3)' 
                      }}>
                      {notice.date} · {notice.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Card 3 ends here */}

        </div>
        {/* LEFT INFO PANEL ends here */}

        {/* RIGHT CHAT PANEL */}
        <div className="chat-panel">
          <ChatWindow />
        </div>

      </div>

      <MobileTabBar />
    </div>
  )
}
