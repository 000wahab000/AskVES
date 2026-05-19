/*export default function Navbar() {
    return (
        <nav style={{
            height: '56px',
            background: '#090f1c',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px'
        }}>
            <span style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 600,
                fontSize: '18px',
                color: '#c8390a'
            }}>
                AskVES
            </span>
        </nav>
    )
}
    */

import { Link } from 'react-router-dom'

const navLinks = [
    { label: 'Chat', path: '/' },
    { label: 'Community', path: '/community' },
    { label: 'Notes', path: '/notes' },
    { label: 'Campus', path: '/campus' },
    { label: 'Placements', path: '/placements' },
]

export default function Navbar() {
    return (
        <nav style={{
            height: '56px',
            backgroundColor: '#090f1c',
            borderBottom: '1px solid rgba(255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginRight: '24px' }}>
                <span style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: '#e8edf8',
                    flexShrink: 0
                }}>
                    AskVES
                </span>
                <span className="ai-badge" style={{
                    backgroundColor: '#c8390a',
                    color: '#ffffff',
                    fontFamily: 'DM Sans',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '800px',
                    whiteSpace: 'nowrap',
                    marginRight: '8px'

                }}>
                    AI Campus Assistant
                </span>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                flexWrap: 'nowrap'

            }}>

                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        style={{
                            fontFamily: 'DM Sans',
                            fontSize: '14px',
                            color: '#8fa3c0',
                            textDecoration: 'none',
                        }}
                    >

                        {link.label}
                    </Link>
                ))}
            </div>

            <div style={{ display: "block", alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                <span className='powered-by' style={{
                    fontFamily: 'DM Sans',
                    fontSize: '12px',
                    color: '#3b4755',
                    marginRight: '12px'
                }}>
                    Powered by: Groq + Gemini
                </span>
                <button style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,0,0.5)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    color: '#ffffff',
                    fontFamily: 'DM Sans',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: '0.2s ease'
                }}>
                    Login
                </button>
            </div>
        </nav>
    )
}

