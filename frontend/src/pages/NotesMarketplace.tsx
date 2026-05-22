import { useState } from "react";
import { Search, FileText, Star, Upload, Download, X } from "lucide-react";
import { TopNavbar } from "../components/TopNavbar";
import { MobileTabBar } from "../components/MobileTabBar";
interface Note {
  id: number;
  subject: string;
  uploader: string;
  semester: string;
  branch: string;
  rating: number;
  downloads: number;
}
export function NotesMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);

  const semesters = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];
  const branches = ["All", "IT", "CS", "EXTC", "MECH"];
  const subjects = ["All", "DSA", "DBMS", "CN", "OS", "TOC", "SE", "AI/ML"];

  const notes = [
    { id: 1, subject: "Data Structures and Algorithms", uploader: "@rahul_m", semester: "3", branch: "IT", rating: 4.5, downloads: 234 },
    { id: 2, subject: "Database Management Systems", uploader: "@priya_s", semester: "4", branch: "CS", rating: 4.8, downloads: 189 },
    { id: 3, subject: "Computer Networks", uploader: "@arjun_k", semester: "5", branch: "IT", rating: 4.2, downloads: 156 },
    { id: 4, subject: "Machine Learning Complete Notes", uploader: "@sneha_p", semester: "7", branch: "IT", rating: 4.9, downloads: 89 },
    { id: 5, subject: "Theory of Computation", uploader: "@amit_v", semester: "5", branch: "CS", rating: 4.7, downloads: 67 },
  ];

  // Helper component to render a note card
  const NotesCard = ({ note }: { note: Note }) => {
    const starColors: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(note.rating)) {
        starColors.push("#f59e0b");
      } else {
        starColors.push("#1d2d45");
      }
    }

    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        {/* PDF Icon Box on the left */}
        <div className="notes-icon-box">
          <FileText className="w-6 h-6" style={{ color: 'var(--t2)' }} />
        </div>
        {/* Note info in the middle */}
        <div style={{ flex: 1 }}>
          <h3 className="notes-subject">{note.subject}</h3>
          <p className="notes-meta">{note.uploader} · Sem {note.semester} · {note.branch}</p>
          <div className="notes-tags">
            <span className="category-tag">Sem {note.semester}</span>
            <span className="category-tag">{note.branch}</span>
          </div>
          <div className="notes-stars">
            {[1, 2, 3, 4, 5].map((star, index) => (
              <Star
                key={star}
                className="w-4 h-4"
                style={{ fill: starColors[index], color: starColors[index] }}
              />
            ))}
            <span className="notes-download-count">{note.downloads} downloads</span>
          </div>
        </div>
        {/* Free badge + Download button on the right */}
        <div className="notes-actions">
          <span className="free-badge">Free</span>
          <button className="download-btn">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    );
  };

  // Filter notes based on active search queries and selected category states
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.uploader.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSemester = selectedSemester === "All" || note.semester === selectedSemester;
    const matchesBranch = selectedBranch === "All" || note.branch === selectedBranch;
    const matchesSubject = selectedSubject === "All" || note.subject.toLowerCase().includes(selectedSubject.toLowerCase());

    return matchesSearch && matchesSemester && matchesBranch && matchesSubject;
  });

  return (
    <div className='page-shell'>
      <TopNavbar />
      
      <main style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingBottom: '80px'
      }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '26px', fontWeight: 600, color: 'var(--t1)' }}>
            Notes Marketplace
          </h1>
          <button 
            onClick={() => {
              setUploadStep(1);
              setShowUploadModal(true);
            }}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              color: '#fff',
              fontFamily: 'DM Sans',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <Upload size={16} />
            Upload Notes
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--t3)'
            }} 
          />
          <input 
            type="text" 
            placeholder="Search subjects or uploaders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-input"
            style={{ paddingLeft: '44px', width: '100%' }}
          />
        </div>

        {/* Semester Filter */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Semester
          </p>
          <div className="categories-scroll">
            <div className="categories-list">
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`category-btn ${selectedSemester === sem ? 'active' : ''}`}
                >
                  {sem === 'All' ? 'All Semesters' : `Sem ${sem}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Filter */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Branch
          </p>
          <div className="categories-scroll">
            <div className="categories-list">
              {branches.map(br => (
                <button
                  key={br}
                  onClick={() => setSelectedBranch(br)}
                  className={`category-btn ${selectedBranch === br ? 'active' : ''}`}
                >
                  {br === 'All' ? 'All Branches' : br}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Tag Filter */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Subject Tag
          </p>
          <div className="categories-scroll">
            <div className="categories-list">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`category-btn ${selectedSubject === sub ? 'active' : ''}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Grid List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <NotesCard key={note.id} note={note} />
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--t2)'
            }}>
              <FileText size={40} style={{ color: 'var(--t3)', marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 500, color: 'var(--t1)', marginBottom: '6px' }}>
                No notes found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--t3)' }}>
                Try adjusting your search query or filters.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal overlay */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowUploadModal(false)}
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: 'none', border: 'none',
                color: 'var(--t2)', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: 600, color: 'var(--t1)', marginBottom: '16px' }}>
              Upload Study Notes
            </h2>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} />
              <div style={{ 
                flex: 1, height: '4px', 
                backgroundColor: uploadStep === 2 ? 'var(--accent)' : 'var(--border-hi)', 
                borderRadius: '2px', transition: 'background-color 0.2s' 
              }} />
            </div>

            {uploadStep === 1 ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--t2)', marginBottom: '6px' }}>
                    Subject Name
                  </label>
                  <input type="text" placeholder="e.g. Distributed Systems" className="chat-input" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--t2)', marginBottom: '6px' }}>
                      Semester
                    </label>
                    <select className="chat-input" style={{ width: '100%', background: 'var(--bg)' }}>
                      {semesters.filter(s => s !== "All").map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--t2)', marginBottom: '6px' }}>
                      Branch
                    </label>
                    <select className="chat-input" style={{ width: '100%', background: 'var(--bg)' }}>
                      {branches.filter(b => b !== "All").map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setUploadStep(2)}
                  style={{
                    width: '100%', background: 'var(--accent)', border: 'none',
                    borderRadius: '8px', padding: '12px', color: '#fff',
                    fontFamily: 'DM Sans', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Next Step
                </button>
              </div>
            ) : (
              <div>
                <div style={{ 
                  border: '2px dashed var(--border-hi)', borderRadius: '12px',
                  padding: '32px 16px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer'
                }}>
                  <FileText size={32} style={{ color: 'var(--t3)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '14px', color: 'var(--t2)', marginBottom: '4px' }}>
                    Drag and drop your PDF here, or
                  </p>
                  <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                    Browse files
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setUploadStep(1)}
                    style={{
                      flex: 1, background: 'transparent',
                      border: '1px solid var(--border-hi)', borderRadius: '8px',
                      padding: '12px', color: 'var(--t1)', cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    style={{
                      flex: 2, background: 'var(--accent)', border: 'none',
                      borderRadius: '8px', padding: '12px', color: '#fff',
                      fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    Submit Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileTabBar />
    </div>
  );
}