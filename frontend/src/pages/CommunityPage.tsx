import { TopNavbar }    from '../components/TopNavbar'
import { MobileTabBar } from '../components/MobileTabBar'

export default function CommunityPage() {
  return (
    <div className="page-shell">

      <TopNavbar />
        <div 
        className="chat-layout"
        >
            <div 
            className="info-panel"
        >
                <div 
                className="card"
          >
            <h2 style={{ 
              fontFamily: 'Space Grotesk', 
              fontWeight: 600, 
              fontSize: '22px', 
              color: '#e8edf8', 
              marginBottom: '12px' }}>
              Unofficial AI Assistant for VESIT Students
            </h2>

            <div 
            className="disclaimer-badge">
              ⚠ Not affiliated with or endorsed by VESIT
            </div>
            </div>
            </div>
        </div>
        <MobileTabBar/>
    </div>
  )
}
