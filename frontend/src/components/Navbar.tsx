export default function Navbar() {
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