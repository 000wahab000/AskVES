import { TopNavbar }    from '../components/TopNavbar'
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
        padding:'32px',
        maxWidth:'1200px',
        margin:'0 auto'
      }}>
        {loading ? (
          <p style={{
            color:'#8fa3c0' 
          }}> loading posts....</p>
        ) : (
          <p style={{
            color:'8fa3c0'
          }}>{posts.length} posts loaded</p>
        )}
      </main>
      <MobileTabBar />
    </div>
      )
    }