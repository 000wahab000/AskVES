
import { Link } from "react-router-dom";


export function NotFound() {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100vh',
            gap: '16px',
            textAlign:'center'
        }
        }>
      <h1 style={{ 
        fontSize: '6rem', 
        margin: 0 
        }}>
            404
        </h1>
      <p style={{ 
        fontSize: '1.2rem', 
        color: '#888' 
        }}>
        This page doesn't exist in AskVES
      </p>
      <Link
        to="/"
        style={{
          padding: '10px 24px',
          background: '#6c63ff',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',  
        }}
      >
        Take me home
      </Link>
        </div>
    )
}