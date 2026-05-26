export const NOTICES = [
    {
 id: 1,
    title: 'End Semester Exams Schedule',
    description: 'End semester exams begin from June 10. Check your hall tickets on the portal.',
    date: '25 May 2026',
    category: 'Exam',
  },
  {
    id: 2,
    title: 'Technovanza 2026 Registration Open',
    description: "Register for VESIT's annual tech fest. Last date is June 1.",
    date: '23 May 2026',
    category: 'Event',
  },
  {
    id: 3,
    title: 'Holiday — Eid al-Adha',
    description: 'College will remain closed on June 7.',
    date: '20 May 2026',
    category: 'Holiday',
  },
  {
    id: 4,
    title: 'Library Timings Updated',
    description: 'Library will now be open till 8pm on weekdays during exam season.',
    date: '18 May 2026',
    category: 'General',
  },
  {
    id: 5,
    title: 'Internal Assessment Results',
    description: 'IA marks for all departments have been uploaded to ERP.',
    date: '15 May 2026',
    category: 'Exam',
  },
]
// Color helper exported too so both pages can use it
export function categoryColor(cat: string) {
  if (cat === 'Exam')    return '#f87171'
  if (cat === 'Event')   return '#1a7fa8'
  if (cat === 'Holiday') return '#4ade80'
  return '#c9921a'
}
    
