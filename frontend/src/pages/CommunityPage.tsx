import { TopNavbar } from '../components/TopNavbar'
import { MobileTabBar } from '../components/MobileTabBar'
import { useState, useEffect } from 'react'

interface Post {
  id: string
  name: string
  email: string
  info: string
  upvotes: number
  flags: number
  timestamp: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/community')
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className='page-shell'>
      <TopNavbar />
      <main style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingBottom: '80px'
      }}>
        {loading ? (
          <p style={{ color: '#8fa3c0' }}>Loading posts...</p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {posts.map(post => (
              <div key={post.id} style={{
                backgroundColor: 'var(--card)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '20px'
              }}>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>

                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#c8390a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#fff'
                    }}>

                      {post.name?.charAt(0) ?? '?'}
                    </div>

                    <div>
                      <p style={{
                        fontFamily: 'Space Grotesk',
                        fontWeight: 500,
                        fontSize: '14px',
                        color: '#e8edf8'
                      }}>
                        {post.name}
                      </p>

                      <p style={{
                        fontFamily: 'DM Sans',
                        fontSize: '12px',
                        color: '#4d6380'
                      }}>
                        {post.email}
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{
                  fontFamily: 'DM Sans',
                  fontSize: '14px',
                  color: '#e8edf8',
                  lineHeight: '1.6'
                }}>
                  {post.info}
                </p>

                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  gap: '16px'
                }}>

                  <button style={{
                    color: '#8fa3c0',
                    fontFamily: 'DM Sans',
                    fontSize: '13px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}>

                    👍 {post.upvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <MobileTabBar />
      </main>
    </div>
  )
}