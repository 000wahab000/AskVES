import { Utensils, Calendar, Users, Printer, CupSoda } from 'lucide-react'
import { TopNavbar }    from '../components/TopNavbar'
import { MobileTabBar } from '../components/MobileTabBar'
import { ChatWindow }   from '../components/ChatWindow'

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
        <div className="info-panel">
          <div className="card">
            <h2 style={{ 
              fontFamily: 'Space Grotesk', 
              fontWeight: 600, 
              fontSize: '22px', 
              color: '#dce8f5', 
              marginBottom: '12px' }}>
              Unofficial AI Assistant for VESIT Students
            </h2>

            <div 
            className="disclaimer-badge">
              as Not affiliated with or endorsed by VESIT
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

                  <div style={{ 
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
                    color: '#7a9bbf' }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div 
          className="card" 
          style={{ 
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
        </div>

        <div 
        className="chat-panel">
          <ChatWindow />
        </div>

      </div>

      <MobileTabBar />
    </div>
  )
}
