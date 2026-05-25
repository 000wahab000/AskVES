import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate()
    

function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
   localStorage.setItem('askves_user', email)
   navigate('/')
  }
   return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '12px',
      background: '#0f0f1a',  
      color: 'white',
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '8px' 
        }}>
        Welcome to AskVES
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            width: '300px' 
        }}>
        <input
          type="email"
          placeholder="Your college email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: '8px',
            border: 'none', 
            fontSize: '1rem' 
        }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: '8px', 
            border: 'none', 
            fontSize: '1rem' 
        }}
        />
         <button
          type="submit"
          style={{
            padding: '10px',
            background: '#6c63ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}>
            login
          </button>
        </form>
        </div>
   )
}