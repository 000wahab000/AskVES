import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
     MessageCircle, CalendarCheck, Users, BookOpen,
  Bell, Zap, Shield, ChevronRight, Star
} from "lucide-react";

const FEATURES = [
    {
icon: MessageCircle,
    title: "AI Campus Assistant",
    desc: "Ask anything — canteen menu, teacher location, xerox prices, events. Powered by Groq & Gemini.",
    color: "#1a7fa8",
    bg: "rgba(26,127,168,0.10)",
    border: "rgba(26,127,168,0.25)",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracker",
    desc: "Log every class. Auto-calculates your % per subject and warns you before you fall below 75%.",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.20)",
  },
  {
    icon: Users,
    title: "Community Board",
    desc: "Students share tips, corrections and campus updates. AI auto-moderates flagged posts.",
    color: "#c9921a",
    bg: "rgba(201,146,26,0.08)",
    border: "rgba(201,146,26,0.20)",
  },
  {
    icon: BookOpen,
    title: "Notes Marketplace",
    desc: "Browse and download study notes shared by seniors and classmates — all in one place.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.20)",
  },
  {
    icon: Bell,
    title: "Notice Board",
    desc: "College announcements, holiday notices and exam updates — always current, never missed.",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.20)",
  },
  {
    icon: Zap,
    title: "WhatsApp Bot",
    desc: "Can't open the app? Ask AskVES directly on WhatsApp and get instant campus answers.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.20)",
  },
];

const STATS = [
  { value: "6", label: "Tools in one portal" },
  { value: "<2s", label: "Average AI response" },
  { value: "75%", label: "Attendance auto-tracked" },
  { value: "VESIT", label: "Built for VES students" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 40;
      const y = (clientY / innerHeight - 0.5) * 40;
      el.style.setProperty("--gx", `${50 + x}%`);
      el.style.setProperty("--gy", `${50 + y}%`);
    };
     window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
 return (
    <div style={{ 
        minHeight: "100vh", 
        background: "#060e1f", 
        color: "#dce8f5", 
        fontFamily: "'DM Sans', sans-serif" 
        }}>
        <nav style={{
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            padding: "0 32px", 
            height: "60px",
            borderBottom: "1px solid rgba(100,160,220,0.10)",
            position: "sticky", 
            top: 0, 
            zIndex: 50,
            background: "rgba(6,14,31,0.85)", 
            backdropFilter: "blur(12px)",
            }}>
        <div 
        style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px" 
            }}>
          <div 
          style={{
            width: "32px", 
            height: "32px", 
            borderRadius: "8px",
            background: "linear-gradient(135deg,#1a7fa8,#0b4f68)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
          }}>
            <MessageCircle size={16} color="#fff" />
          </div>
          <span 
          style={{ 
            fontFamily: "'Space Grotesk',sans-serif", 
            fontWeight: 700, 
            fontSize: "18px",
            color: "#dce8f5" }}>
            AskVES
             </span>
          <span 
          style={{
            background: "rgba(26,127,168,0.15)", 
            color: "#1a7fa8",
            border: "1px solid rgba(26,127,168,0.30)", 
            borderRadius: "999px",
            padding: "2px 8px", 
            fontSize: "11px", 
            fontWeight: 500,
          }}>
            VESIT
            </span>
        </div>
         <button
          id="nav-login-btn"
          onClick={() => navigate("/login")}
          style={{
            background: "#1a7fa8", 
            color: "#fff", 
            border: "none",
            borderRadius: "8px", 
            padding: "8px 20px",
            fontFamily: "'DM Sans',sans-serif", 
            fontSize: "14px", 
            fontWeight: 500,
            cursor: "pointer", 
            transition: "background 0.15s",
          }}
          onMouseEnter={e => 
            (e.currentTarget.style.background = "#135f80")}
          onMouseLeave={e => 
            (e.currentTarget.style.background = "#1a7fa8")}
        >Login with college email
        </button>
      </nav>

      <div
        ref={heroRef}
        style={{
          position: "relative", 
          textAlign: "center",
          padding: "100px 24px 80px",
          background: "radial-gradient(ellipse 70% 50% at var(--gx,50%) var(--gy,40%), rgba(26,127,168,0.18) 0%, transparent 70%)",
          overflow: "hidden",
        }}
      >
        <div 
        style={{
          position: "absolute", 
          inset: 0, 
          opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(100,160,220,1) 1px,transparent 1px), linear-gradient(90deg,rgba(100,160,220,1) 1px,transparent 1px)",
          backgroundSize: "40px 40px", 
          pointerEvents: "none",
        }} />
         <div style={{
          display: "inline-flex", 
          alignItems: "center", 
          gap: "6px",
          background: "rgba(26,127,168,0.12)", 
          border: "1px solid rgba(26,127,168,0.30)",
          borderRadius: "999px", 
          padding: "5px 14px", 
          marginBottom: "28px",
          fontSize: "12px", 
          color: "#7a9bbf",
        }}>
            <Star size={12} 
            color="#c9921a" 
            fill="#c9921a" 
            />
          Built exclusively for VESIT students
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif", 
          fontWeight: 700,
          fontSize: "clamp(36px,6vw,72px)", 
          lineHeight: 1.1,
          marginBottom: "20px", 
          maxWidth: "800px", 
          margin: "0 auto 20px",
        }}>
            Your college,{" "}
          <span style={{
            background: "linear-gradient(90deg,#1a7fa8,#4db8d8)",
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
          }}>
            answered instantly
          </span>
        </h1>
          <p style={{
          fontSize: "18px", 
          color: "#7a9bbf", 
          maxWidth: "540px",          
          margin: "0 auto 40px", 
          lineHeight: 1.7,
        }}>
          AskVES is an AI-powered portal that knows your timetable, canteen menu,
          teacher schedules, and more — so you don't have to ask around.
        </p>
         <div style={{ 
            display: "flex", 
            gap: "12px", 
            justifyContent: "center", 
            flexWrap: "wrap" }}>
          <button
            id="hero-login-btn"
            onClick={() => navigate("/login")}
            style={{
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              background: "#1a7fa8", 
              color: "#fff", 
              border: "none",
              borderRadius: "10px", 
              padding: "14px 28px",
              fontFamily: "'DM Sans',sans-serif", 
              fontSize: "15px", 
              fontWeight: 600,
              cursor: "pointer", 
              transition: "all 0.2s",
              boxShadow: "0 0 32px rgba(26,127,168,0.35)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#135f80"; 
                e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1a7fa8"; 
                e.currentTarget.style.transform = "translateY(0)"; }}
          >
             Get started free <ChevronRight size={16} />
          </button>
           <button
            id="hero-scroll-btn"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent", 
              color: "#7a9bbf",
              border: "1px solid rgba(100,160,220,0.20)", 
              borderRadius: "10px",
              padding: "14px 28px", 
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "15px", 
              cursor: "pointer", 
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#dce8f5"; 
                e.currentTarget.style.borderColor = "rgba(100,160,220,0.40)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#7a9bbf"; 
                e.currentTarget.style.borderColor = "rgba(100,160,220,0.20)"; }}
          >
            See what it can do
          </button>
        </div>
        <div 
        style={{
          display: "flex", 
          gap: "0", 
          justifyContent: "center", 
          flexWrap: "wrap",
          marginTop: "72px", 
          borderTop: "1px solid rgba(100,160,220,0.08)",
          paddingTop: "40px",
        }}>
             {STATS.map((s, i) => (
            <div key={i} style={{
              padding: "0 40px",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(100,160,220,0.10)" : "none",
              textAlign: "center",
            }}>
                <p 
                style={{ 
                fontFamily: "'Space Grotesk',sans-serif", 
                fontWeight: 700, 
                fontSize: "28px", 
                color: "#dce8f5", 
                marginBottom: "4px" 
                    }}>
                        {s.value}
                        </p>
              <p 
              style={{ 
                fontSize: "12px", 
                color: "#3d5a7a" 
                }}>
                    {s.label}
                                </p>

            </div>
            ))}
        </div>
      </div>
      <section 
      id="features" 
      style={{ 
        maxWidth: "1100px", 
        margin: "0 auto", 
        padding: "80px 24px" 
        }}>
        <div 
        style={{ 
            textAlign: "center", 
            marginBottom: "56px" 
            }}>
          <p 
          style={{ 
            fontSize: "12px", 
            color: "#3d5a7a", 
            letterSpacing: "2px", 
            textTransform: "uppercase", 
            marginBottom: "12px" 
            }}>Everything in one place
            </p>
          <h2 
          style={{ 
            fontFamily: "'Space Grotesk',sans-serif", 
            fontWeight: 600, 
            fontSize: "clamp(24px,4vw,40px)", 
            color: "#dce8f5" 
            }}>
            Six tools. One login. Zero hassle.
          </h2>
        </div>
         <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  background: f.bg, 
                  border: `1px solid ${f.border}`,
                  borderRadius: "14px", 
                  padding: "24px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; 
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${f.bg}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; 
                    (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{
                  width: "44px", 
                  height: "44px", 
                  borderRadius: "10px",
                  background: `${f.color}22`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3 style={{ 
                    fontFamily: "'Space Grotesk',sans-serif", 
                    fontWeight: 600, 
                    fontSize: "16px", 
                    color: "#dce8f5", 
                    marginBottom: "8px" 
                    }}>
                  {f.title}
                </h3>
                <p style={{ 
                    fontSize: "14px", 
                    color: "#7a9bbf", 
                    lineHeight: 1.65 
                    }}>
                        {f.desc} 
                                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ 
        background: "#0b1730", 
        padding: "80px 24px" 
        }}>
        <div style={{ 
            maxWidth: "700px", 
            margin: "0 auto", 
            textAlign: "center" 
            }}>
          <h2 style={{ 
            fontFamily: "'Space Grotesk',sans-serif", 
            fontWeight: 600, 
            fontSize: "clamp(22px,4vw,36px)", 
            color: "#dce8f5", 
            marginBottom: "48px" 
            }}>
            How it works
          </h2>
          {[
            { step: "01", title: "Login with your @ves.ac.in email", desc: "Secure login restricted to VESIT students only. No randoms." },
            { step: "02", title: "Tell us your class", desc: "We load your timetable, subjects and batch automatically from the database." },
            { step: "03", title: "Ask anything", desc: "\"Where is Mugdha ma'am right now?\" — AskVES checks the live timetable and answers in under 2 seconds." },
          ].map((item) => (
            <div key={item.step} 
            style={{ 
                display: "flex", 
                gap: "20px", 
                textAlign: "left", 
                marginBottom: "36px", 
                alignItems: "flex-start" 
                }}>
              <div style={{
                fontFamily: "'Space Grotesk',sans-serif", 
                fontWeight: 700, 
                fontSize: "32px",
                color: "rgba(26,127,168,0.30)", 
                flexShrink: 0,
                width: "48px", 
                lineHeight: 1,
              }}>{item.step}</div>
              <div>
                <p 
                style={{ 
                    fontWeight: 600, 
                    fontSize: "16px", 
                    color: "#dce8f5", 
                    marginBottom: "6px" 
                    }}>
                        {item.title}
                                    </p>
                <p style={{ 
                    fontSize: "14px", 
                    color: "#7a9bbf", 
                    lineHeight: 1.6 
                    }}>
                        {item.desc}
                                    </p>
              </div>
            </div>
          ))}
        </div>
      </section>
          <section style={{ 
            textAlign: "center", 
            padding: "100px 24px" 
            }}>
        <div style={{
          display: "inline-block", 
          background: "rgba(26,127,168,0.06)",
          border: "1px solid rgba(26,127,168,0.15)", 
          borderRadius: "20px", 
          padding: "60px 48px", 
          maxWidth: "600px",
        }}>
          <Shield 
          size={40} 
          color="#1a7fa8" 
          style={{ 
            marginBottom: "20px" 
            }} />
          <h2 style={{ 
            fontFamily: "'Space Grotesk',sans-serif", 
            fontWeight: 600, 
            fontSize: "28px", 
            color: "#dce8f5", 
            marginBottom: "12px" 
            }}>
            Made by VESIT students, for VESIT students
          </h2>
          <p 
          style={{ 
            fontSize: "14px", 
            color: "#7a9bbf", 
            marginBottom: "32px", 
            lineHeight: 1.7 
            }}>
            AskVES is open-source and built by your classmates. Your data never leaves the college ecosystem.
          </p>
          <button
            id="cta-login-btn"
            onClick={() => navigate("/login")}
            style={{
              background: "#1a7fa8", 
              color: "#fff", 
              border: "none",
              borderRadius: "10px", 
              padding: "14px 32px",
              fontFamily: "'DM Sans',sans-serif", 
              fontSize: "15px", 
              fontWeight: 600,
              cursor: "pointer", 
              transition: "background 0.15s",
              boxShadow: "0 0 40px rgba(26,127,168,0.30)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#135f80")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a7fa8")}
          >
            Login with college email →
          </button>
        </div>
      </section>
         <footer style={{
        borderTop: "1px solid rgba(100,160,220,0.08)",
        padding: "24px 32px", 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: "8px",
        fontSize: "12px", 
        color: "#3d5a7a",
      }}>
        <span>© 2025 AskVES — Vivekanand Education Society's Institute of Technology</span>
        <span>Restricted to @ves.ac.in accounts</span>
      </footer>
    </div>
  );
}
