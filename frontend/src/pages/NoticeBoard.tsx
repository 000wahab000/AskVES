import { useState } from "react";

const DATASACK = [
    { id: 1,title: 'End Semester Exams Schedule',      
            description: 'End semester exams begin from June 10. Check your hall tickets on the portal.', 
            date: '25 May 2026', 
            category: 'Exam' },
    { id: 2,title: 'Technovanza 2026 Registration Open', 
            description: "Register for VESIT's annual tech fest. Last date is June 1.",                  
            date: '23 May 2026', 
            category: 'Event' },
    { id: 3,title: 'Holiday — Eid al-Adha',             
            description: 'College will remain closed on June 7.',                                          
            date: '20 May 2026', 
            category: 'Holiday' },
    { id: 4,title: 'Library Timings Updated',           
            description: 'Library will now be open till 8pm on weekdays during exam season.',               
            date: '18 May 2026', 
            category: 'General' },
    { id: 5,title: 'Internal Assessment Results',       
            description: 'IA marks for all departments have been uploaded to ERP.',                         
            date: '15 May 2026', 
            category: 'Exam' },
]

const CATEGORIES = ['All','Exam', 'Event', 'Holiday', 'General']

export function NoticeBoard() {
    const [selected, setSelected] = useState('All')
    const filtered = selected === 'All'
    ? DATASACK 
    : DATASACK.filter((n) => n.category === selected)

    function categoryColor(cat: string) {
        if (cat === 'Exam')    return '#f87171'
        if (cat === 'Event')   return '#1a7fa8'   
        if (cat === 'Holiday') return '#4ade80'
            return '#c9921a'
    }
    return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',        
      color: 'var(--t1)',             
      padding: '40px 20px',
      maxWidth: '700px',
      margin: '0 auto',
    }}>
      <h1 style={{ 
        fontSize: '2rem',
         marginBottom: '8px' 
         }}> Notice Board
         </h1>
      <p style={{ 
        color: 'var(--t2)',
         marginBottom: '24px'
          }}>  
          {/* fun parts over bruh */}
        Latest announcements from VESIT
      </p>

      {/* clciky clacikys*/}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap', 
        marginBottom: '28px' 
        }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setSelected(cat)} style={{
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid',
            cursor: 'pointer',
            fontSize: '0.9rem',
            background:  selected === cat ? 'var(--accent)' : 'transparent',   
            borderColor: selected === cat ? 'var(--accent)' : 'var(--border-hi)', 
            color:       selected === cat ? 'white'         : 'var(--t2)',      
          }}>
            {cat}
          </button>
        ))}
      </div>

          {/* Notice cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((notice) => (
          <div key={notice.id} style={{
            background: 'var(--card)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${categoryColor(notice.category)}`,
          }}>

         {/* Category thingy mi bob*/}
            <span style={{
              fontSize: '0.75rem',
              background: categoryColor(notice.category) + '22',
              color: categoryColor(notice.category),
              padding: '2px 10px',
              borderRadius: '999px',
              fontWeight: 600,
            }}>
              {notice.category}
            </span>
            <h2 style={{ fontSize: '1.1rem', margin: '10px 0 6px', color: 'var(--t1)' }}>
              {notice.title}
            </h2>
            <p style={{ color: 'var(--t2)', fontSize: '0.9rem', margin: '0 0 10px' }}>
              {notice.description}
            </p>
            <p style={{ color: 'var(--t3)', fontSize: '0.8rem', margin: 0 }}>
              📅 {notice.date}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--t3)', textAlign: 'center', padding: '60px 0' }}>
            No notices in this category.
          </p>
        )}
      </div>
    </div>
  )
}
