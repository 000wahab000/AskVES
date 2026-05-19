import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Users, BookOpen, Building2, Briefcase } from 'lucide-react'

const TABS = [
  { label: 'Chat',       path: '/',           Icon: MessageCircle },
  { label: 'Community',  path: '/community',  Icon: Users },
  { label: 'Notes',      path: '/notes',      Icon: BookOpen },
  { label: 'Campus',     path: '/campus',     Icon: Building2 },
  { label: 'Placements', path: '/placements', Icon: Briefcase },
]

export function MobileTabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="mobile-tab-bar">
      {TABS.map(({ label, path, Icon }) => (
        <Link key={path} to={path} className={`tab-item${pathname === path ? ' active' : ''}`}>
          <Icon size={20} strokeWidth={pathname === path ? 2.2 : 1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
