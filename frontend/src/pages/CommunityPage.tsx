import { TopNavbar } from '../components/TopNavbar'
import { MobileTabBar } from '../components/MobileTabBar'
import { useState } from 'react'
import { ArrowUp, MessageSquare, Flag, Plus, UserCircle, CheckCircle } from 'lucide-react'


export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [upvotedPosts, setUpvotedPosts] = useState<number[]>([]);
 

  const categories = ["All", "general", "Academics", "placements",
    "Hostel", "rants", "confessions"];
  const posts = [
    {
      id: 1,
      username: "Rahul M",
      initials: "RM",
      avatarColor: "#3b82f6",
      isVerified: true,
      category: "Academics",
      timestamp: "2h ago",
      content: "Anyone has notes for Data Structures? Need it for tomorrow's exam preparation. Will be really helpful!",
      upvotes: 24,
      comments: 8,
      type: "text",
      isAnonymous: false
    },
    {
      id: 2,
      username: "Anonymous",
      initials: "A",
      avatarColor: "#6b7280",
      isVerified: false,
      category: "Confessions",
      timestamp: "4h ago",
      content: "I've been procrastinating on my final year project for 2 months now. The deadline is in 3 weeks and I haven't even started the coding part yet.",
      upvotes: 156,
      comments: 42,
      type: "text",
      isAnonymous: true
    },
    {
      id: 3,
      username: "Priya S",
      initials: "PS",
      avatarColor: "#8b5cf6",
      isVerified: true,
      category: "Placements",
      timestamp: "1d ago",
      content: "Got placed at Microsoft! AMA about the interview process.",
      upvotes: 287,
      comments: 63,
      type: "text",
      isAnonymous: false
    },
    {
      id: 4,
      username: "Arjun K",
      initials: "AK",
      avatarColor: "#10b981",
      isVerified: true,
      category: "General",
      timestamp: "3h ago",
      content: "Which is better for placements prep?",
      upvotes: 12,
      comments: 15,
      type: "poll",
      isAnonymous: false,
      poll: [
        { option: "LeetCode", votes: 45, percentage: 62 },
        { option: "GeeksForGeeks", votes: 28, percentage: 38 }
      ]
    },
    {
      id: 5,
      username: "Sneha P",
      initials: "SP",
      avatarColor: "#f59e0b",
      isVerified: true,
      category: "Hostel",
      timestamp: "5h ago",
      content: "Hostel mess food quality has improved significantly this semester! Kudos to the management.",
      upvotes: 89,
      comments: 21,
      type: "text",
      isAnonymous: false
    }
  ];
  const trending = [
    { id: 1, title: "Tips for cracking TCS Digital interview", upvotes: 234 },
    { id: 2, title: "Library AC not working again", upvotes: 187 },
    { id: 3, title: "Best places for group study near campus", upvotes: 156 },
    { id: 4, title: "Semester exam schedule discussion", upvotes: 142 },
    { id: 5, title: "Canteen new menu items review", upvotes: 128 }
  ];
  let filteredPosts
  if (activeCategory === "All") {
    filteredPosts = posts;
  } else {
    filteredPosts = posts.filter((post) => post.category === activeCategory);
  }

  const handleUpvote = (post : number) => {
    setUpvotedPosts(prev => {
      if (prev.includes(post)){
        return prev.filter(id => id !== post);
      } else {
        return [...prev, post];
      }
      });
    };
  

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PostCard = ({ post } :{post : any} ) => {
  const isUpvoted = upvotedPosts.includes(post.id)
  
    // 1. Get avatar background color
    let avatarBgColor;
    if (post.isAnonymous) {
      avatarBgColor = "var(--t3)";
    } else {
      avatarBgColor = post.avatarColor;
    }

    // 2. Get avatar inside content (Initials or Icon)
    let avatarContent;
    if (post.isAnonymous) {
      avatarContent = <UserCircle className="w-5 h-5" />;
    } else {
      avatarContent = post.initials;
    }

    // 3. Get verified badge (Only show if verified and NOT anonymous)
    let verifiedBadge = null;
    if (post.isVerified) {
      if (!post.isAnonymous) {
        verifiedBadge = (
          <div className="verified-badge">
            <CheckCircle className="w-3 h-3" />
            @ves.ac.in
          </div>
        );
      }
    }

    // 4. Get poll UI (Only build if it's a poll post)
    let pollComponent = null;
    if (post.type === "poll") {
      if (post.poll) {
        pollComponent = (
          <div className="poll-container">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {post.poll.map((option: any, index: number) => (
              <div key={index} className="poll-option">
                <div className="poll-bar" style={{ width: option.percentage + "%" }} />
                <div className="poll-text-row">
                  <span className="poll-label">{option.option}</span>
                  <span className="poll-stats">{option.percentage}% ({option.votes})</span>
                </div>
              </div>
            ))}
          </div>
        );
      }
    }

    // 5. Get upvote button class name
    let upvoteBtnClass;
    if (isUpvoted) {
      upvoteBtnClass = "action-btn upvoted";
    } else {
      upvoteBtnClass = "action-btn";
    }

    // 6. Get total upvotes count display
    let totalUpvotes = post.upvotes;
    if (isUpvoted) {
      totalUpvotes = totalUpvotes + 1;
    }

    return (
      <div className="card" style={{ marginBottom: "12px" }}>
        
        {/* Post Header */}
        <div className="post-header">
          <div className="author-info">
            <div className="author-avatar" style={{ backgroundColor: avatarBgColor }}>
              {avatarContent}
            </div>

            <div className="author-meta">
              <span className="author-name">{post.username}</span>
              {verifiedBadge}
              <span className="category-tag">{post.category}</span>
            </div>
          </div>

          <span className="post-time">{post.timestamp}</span>
        </div>

        {/* Post Body */}
        <p className="post-body">{post.content}</p>

        {/* Poll Options (Only prints if it was created above) */}
        {pollComponent}

        {/* Footer Actions */}
        <div className="post-footer">
          <button onClick={() => handleUpvote(post.id)} className={upvoteBtnClass}>
            <ArrowUp className="w-4 h-4" />
            <span>{totalUpvotes}</span>
          </button>

          <button className="action-btn">
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments}</span>
          </button>

          <button className="action-btn report-btn">
            <Flag className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>

      </div>
    );
  };
  return (
    <div className="page-shell">
      <TopNavbar />

      <main className="chat-layout" style={{ maxWidth: '1400px', flexDirection: 'column' }}>

        <div className="categories-scroll">
          <div className="categories-list">
            {categories.map((category) => {
              let btnClass;
              if (activeCategory === category) {
                btnClass = "category-btn active";
              } else {
                btnClass = "category-btn";
              }
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={btnClass}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="community-layout">
          <div className="feed-column">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="sidebar-column">
            <div className="card trending-card">
              <div className="trending-title-row">
                <div className="trending-marker" />
                <h2 className="trending-title">Trending Topics</h2>
              </div>
              <div className="trending-list">
                {trending.map((item, index) => (
                  <button key={item.id} className="trending-item">
                    <span className="trending-rank">{index + 1}</span>
                    <div>
                      <p className="trending-item-title">{item.title}</p>
                      <span className="trending-item-meta">{item.upvotes} upvotes</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="floating-action-btn">
          <Plus className="w-6 h-6" />
        </button>

      </main>

      <MobileTabBar />
    </div>
  );
}




