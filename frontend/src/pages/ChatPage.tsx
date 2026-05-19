import Navbar from "../components/Navbar"

export default function ChatPage() {
    return (
        <div>
            <Navbar />
            <main style={{padding: '32'}}>
                <p style={{color: '#8fa3c0' , fontFamily: 'DM Sans'}}>
                    Chat coming soon
                </p>
            </main>
        </div>
    )
}
/*
export default function ChatPage() {
  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ 
        fontFamily: 'Space Grotesk', 
        fontWeight: 600, 
        fontSize: '24px',
        color: '#e8edf8',
        marginBottom: '8px'
      }}>
        AskVES
      </h1>
      <p style={{ 
        fontFamily: 'DM Sans', 
        fontSize: '14px', 
        color: '#8fa3c0' 
      }}>
        Unofficial AI assistant for VESIT students
      </p>
    </div>
  )
}
  */