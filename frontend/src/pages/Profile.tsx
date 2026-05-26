import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Profile() {
    const navigate = useNavigate()
    const saved = JSON.parse(localStorage.getItem('askves_user') ?? '{}' )

    const [form , setForm ] = useState({
        name: saved.name ?? '',
        department: saved.department ?? '',
        year:       saved.year       ?? '',
        classCode:  saved.classCode  ?? '',
    })
    const [isEditing, setIsEditing] = useState(false)
    
    function handleSave() {
        localStorage.setItem('askves_user',JSON.stringify(form))
        setIsEditing(false)
    }
    function handleLogout() {
        localStorage.removeItem('askves_user')
        navigate('/login')
    }
    return(
        <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '40px 20px',
    }}>
    <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',           
        background: '#1a7fa8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 700,
      }}>
         {form.name?.[0]?.toUpperCase() ?? 'U'}
         </div>
        <h1 style={{ 
            fontSize: '1.8rem', 
            margin: 0 
        }}>{
            form.name || 'Your Profile'
            }</h1>
        <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            }}>
      

       
          <p style={{ 
            color: '#888', 
            fontSize: '0.8rem', 
            marginBottom: '4px' 
            }}>
                Name
                </p>
          {isEditing ? 
          (<input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '1rem' }}/>
          ) : (
            <p 
            style={{ 
                fontSize: '1rem', 
                margin: 0 }}>{form.name || '—'}</p>)} 
        </div>
            <div>
          <p style={{ 
            color: '#888', 
            fontSize: '0.8rem',
             marginBottom: '4px' 
             }}>
                Department
                            </p>
          {isEditing ? (
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '1rem' }}
            />
          ) : (
            <p style={{ 
                fontSize: '1rem', 
                margin: 0  }}>{form.department || '—'}</p>)}
        </div>


        <div>
            <p style={{ 
                color: '#888', 
                fontSize: '0.8rem', 
                marginBottom: '4px' 
                }}>
                    Year
                        </p>
                {isEditing ? (
                <input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    border: 'none',                                         
                    fontSize: '1rem' }}
                    />
                ) : (
                     <p style={{ 
                        fontSize: '1rem', 
                        margin: 0 
                            }}>{form.year || '—'}</p>)}
        </div>
                 <div>
          <p style={{ 
            color: '#888', 
            fontSize: '0.8rem', 
            marginBottom: '4px' 
            }}>
                Class Code
                            </p>
          {isEditing ? (
            <input
              value={form.classCode}
              onChange={(e) => setForm({ ...form, classCode: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '1rem' 
            }}
            />
          ) : (
            <p style={{ fontSize: '1rem', margin: 0 }}>{form.classCode || '—'}</p>
          )}
            </div>
        
    
            <button onClick={isEditing ? handleSave : () => setIsEditing(true)}
          style={{
            padding: '10px 24px',
            background: '#6c63ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {isEditing ? 'Save' : 'Edit Profile'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: '#f87171',
            border: '1px solid #f87171',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Logout
        </button>
      </div>
    )
}