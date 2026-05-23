import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MinusCircle, AlertTriangle, BookOpen, TrendingUp, Calendar, RotateCcw } from "lucide-react";
import { TopNavbar } from "../components/TopNavbar";
import { MobileTabBar } from "../components/MobileTabBar";

// ─── Timetable (synced data) ──────────────────────────────────────────────────
// Mon=0 … Sat=5, Period 0-6
// "—" = no class that period

const SUBJECTS = ["DSA", "DBMS", "CN", "OS", "MP", "SE"];

const TIMETABLE: string[][] = [
  // Mon   P0      P1      P2      P3      P4      P5      P6
  ["DSA", "DBMS", "—", "CN", "OS", "—", "Lab"],
  // Tue
  ["—", "CN", "CN", "DSA", "—", "DBMS", "Lab"],
  // Wed
  ["DBMS", "—", "DSA", "MP", "SE", "—", "—"],
  // Thu
  ["CN", "DBMS", "—", "—", "DSA", "SE", "Lab"],
  // Fri
  ["—", "—", "DBMS", "CN", "—", "DSA", "MP"],
  // Sat
  ["MP", "SE", "—", "OS", "—", "—", "—"],
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIOD_TIMES = [
  "8:00–9:00",
  "9:00–10:00",
  "10:00–11:00",
  "11:00–12:00",
  "12:00–1:00",
  "2:00–3:00",
  "3:00–5:00",
];

type Status = "present" | "absent" | "cancelled";

// key format: "YYYY-MM-DD_dayIdx_periodIdx"
function makeKey(date: string, dayIdx: number, periodIdx: number) {
  return `att_${date}_${dayIdx}_${periodIdx}`;
}

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getTodayDayIdx() {
  const d = new Date().getDay(); // 0=Sun
  if (d === 0) return -1;        // Sunday – no classes
  return d - 1;                  // Mon→0, Sat→5
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AttendanceTracker() {
  const [attendance, setAttendance] = useState<Record<string, Status>>(() => {
    try {
      const raw = localStorage.getItem("askves_attendance");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const idx = getTodayDayIdx();
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<"today" | "week" | "stats">("today");
  const today = todayString();

  // Persist to localStorage whenever attendance changes
  useEffect(() => {
    localStorage.setItem("askves_attendance", JSON.stringify(attendance));
  }, [attendance]);

  // ── mark a class ────────────────────────────────────────────────────────────
  function mark(date: string, dayIdx: number, periodIdx: number, status: Status) {
    const key = makeKey(date, dayIdx, periodIdx);
    setAttendance(prev => {
      const next = { ...prev };
      if (next[key] === status) {
        delete next[key]; // toggle off
      } else {
        next[key] = status;
      }
      return next;
    });
  }

  function getStatus(date: string, dayIdx: number, periodIdx: number): Status | null {
    return attendance[makeKey(date, dayIdx, periodIdx)] || null;
  }

  // ── per-subject stats ────────────────────────────────────────────────────────
  function subjectStats(subject: string) {
    let held = 0;
    let present = 0;
    Object.entries(attendance).forEach(([key, status]) => {
      // key: att_YYYY-MM-DD_dayIdx_periodIdx
      const parts = key.split("_");
      if (parts.length < 4) return;
      const dIdx = parseInt(parts[2]);
      const pIdx = parseInt(parts[3]);
      const cell = TIMETABLE[dIdx]?.[pIdx];
      if (cell === subject || (subject === "Lab" && cell === "Lab")) {
        if (status !== "cancelled") {
          held++;
          if (status === "present") present++;
        }
      }
    });
    const pct = held > 0 ? Math.round((present / held) * 100) : null;
    return { held, present, absent: held - present, pct };
  }

  // ── reset all ────────────────────────────────────────────────────────────────
  function resetAll() {
    if (window.confirm("Reset all attendance data? This cannot be undone.")) {
      setAttendance({});
      localStorage.removeItem("askves_attendance");
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  function pctColor(pct: number | null) {
    if (pct === null) return "#4d6380";
    if (pct >= 85) return "#4ade80";
    if (pct >= 75) return "#fbbf24";
    return "#f87171";
  }

  function pctBg(pct: number | null) {
    if (pct === null) return "rgba(255,255,255,0.04)";
    if (pct >= 85) return "rgba(74,222,128,0.08)";
    if (pct >= 75) return "rgba(251,191,36,0.08)";
    return "rgba(248,113,113,0.08)";
  }

  function pctBorder(pct: number | null) {
    if (pct === null) return "rgba(255,255,255,0.07)";
    if (pct >= 85) return "rgba(74,222,128,0.20)";
    if (pct >= 75) return "rgba(251,191,36,0.20)";
    return "rgba(248,113,113,0.20)";
  }

  // How many more classes to attend to reach 75%
  function classesNeeded(subject: string) {
    const { held, present } = subjectStats(subject);
    // We need present/(held+x) >= 0.75  →  x >= (0.75*held - present)/0.25
    const x = Math.ceil((0.75 * held - present) / 0.25);
    return x > 0 ? x : 0;
  }

  // ── today's timetable ────────────────────────────────────────────────────────
  const todayDayIdx = getTodayDayIdx();

  // ── StatusButton ─────────────────────────────────────────────────────────────
  const StatusBtn = ({
    label, icon: Icon, color, active, onClick
  }: {
    label: string;
    icon: any;
    color: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 12px",
        borderRadius: "6px",
        border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.10)",
        backgroundColor: active ? `${color}22` : "transparent",
        color: active ? color : "#4d6380",
        fontFamily: "DM Sans",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s"
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );

  // ── DayClassRow ───────────────────────────────────────────────────────────────
  const DayClassRow = ({
    subject, periodIdx, dayIdx, date
  }: {
    subject: string; periodIdx: number; dayIdx: number; date: string;
  }) => {
    if (subject === "—") return null;
    const status = getStatus(date, dayIdx, periodIdx);

    return (
      <div
        style={{
          backgroundColor: "#0d1829",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        {/* Time */}
        <div style={{ minWidth: "90px" }}>
          <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4d6380", marginBottom: "2px" }}>
            Period {periodIdx + 1}
          </p>
          <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#8fa3c0" }}>
            {PERIOD_TIMES[periodIdx]}
          </p>
        </div>

        {/* Subject chip */}
        <span
          style={{
            backgroundColor: subject === "Lab" ? "rgba(139,92,246,0.15)" : "rgba(200,57,10,0.12)",
            color: subject === "Lab" ? "#a78bfa" : "#c8390a",
            border: subject === "Lab" ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(200,57,10,0.25)",
            borderRadius: "6px",
            padding: "4px 12px",
            fontFamily: "Space Grotesk",
            fontSize: "13px",
            fontWeight: 600,
            flex: 1
          }}
        >
          {subject}
        </span>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <StatusBtn
            label="Present" icon={CheckCircle} color="#4ade80"
            active={status === "present"}
            onClick={() => mark(date, dayIdx, periodIdx, "present")}
          />
          <StatusBtn
            label="Absent" icon={XCircle} color="#f87171"
            active={status === "absent"}
            onClick={() => mark(date, dayIdx, periodIdx, "absent")}
          />
          <StatusBtn
            label="Cancelled" icon={MinusCircle} color="#fbbf24"
            active={status === "cancelled"}
            onClick={() => mark(date, dayIdx, periodIdx, "cancelled")}
          />
        </div>
      </div>
    );
  };

  // ── overall attendance ────────────────────────────────────────────────────────
  const allStats = SUBJECTS.map(s => ({ subject: s, ...subjectStats(s) }));
  const totalHeld = allStats.reduce((a, s) => a + s.held, 0);
  const totalPresent = allStats.reduce((a, s) => a + s.present, 0);
  const overallPct = totalHeld > 0 ? Math.round((totalPresent / totalHeld) * 100) : null;

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <TopNavbar />

      <main className="mx-auto px-8 py-12" style={{ maxWidth: "1200px" }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "32px", color: "#e8edf8", marginBottom: "6px" }}>
              Attendance Tracker
            </h1>
            <p style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#8fa3c0" }}>
              Synced to your timetable · {DAYS[todayDayIdx >= 0 ? todayDayIdx : 0]}, {today}
            </p>
          </div>

          <button
            onClick={resetAll}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              backgroundColor: "transparent",
              border: "1px solid rgba(248,113,113,0.30)",
              color: "#f87171",
              borderRadius: "8px",
              padding: "8px 16px",
              fontFamily: "DM Sans",
              fontSize: "13px",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
        </div>

        {/* Overall stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Overall", value: overallPct !== null ? `${overallPct}%` : "—", sub: "attendance", color: pctColor(overallPct) },
            { label: "Classes Held", value: String(totalHeld), sub: "total tracked", color: "#e8edf8" },
            { label: "Present", value: String(totalPresent), sub: "marked present", color: "#4ade80" },
            { label: "Absent", value: String(totalHeld - totalPresent), sub: "missed", color: "#f87171" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: "#0d1829",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center"
              }}
            >
              <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "28px", color: card.color, marginBottom: "4px" }}>
                {card.value}
              </p>
              <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#4d6380", marginBottom: "2px" }}>{card.label}</p>
              <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#2d4060" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Low attendance warning */}
        {allStats.some(s => s.pct !== null && s.pct < 75) && (
          <div
            className="mb-8 flex items-start gap-3"
            style={{
              backgroundColor: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: "10px",
              padding: "14px 16px"
            }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "#f87171", marginTop: "2px" }} />
            <div>
              <p style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: "14px", color: "#f87171", marginBottom: "4px" }}>
                Low Attendance Warning
              </p>
              <p style={{ fontFamily: "DM Sans", fontSize: "13px", color: "#8fa3c0" }}>
                {allStats.filter(s => s.pct !== null && s.pct < 75).map(s => {
                  const need = classesNeeded(s.subject);
                  return `${s.subject}: ${s.pct}% (attend ${need} more to reach 75%)`;
                }).join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["today", "week", "stats"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels: Record<string, string> = { today: "Today's Classes", week: "Weekly View", stats: "Subject Stats" };
            const icons: Record<string, any> = { today: Calendar, week: TrendingUp, stats: BookOpen };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  backgroundColor: isActive ? "rgba(200,57,10,0.12)" : "transparent",
                  color: isActive ? "#c8390a" : "#8fa3c0",
                  border: isActive ? "1px solid rgba(200,57,10,0.30)" : "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontFamily: "DM Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <Icon className="w-4 h-4" />
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── TAB: TODAY ─────────────────────────────────────────────────────── */}
        {activeTab === "today" && (
          <div>
            {todayDayIdx < 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8fa3c0", fontFamily: "DM Sans" }}>
                🎉 It's Sunday — no classes today!
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-4">
                  <div style={{ width: "3px", height: "18px", backgroundColor: "#c8390a", marginRight: "10px" }} />
                  <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "18px", color: "#e8edf8" }}>
                    {DAYS[todayDayIdx]} — {today}
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {TIMETABLE[todayDayIdx].map((subject, pIdx) => (
                    <DayClassRow
                      key={pIdx}
                      subject={subject}
                      periodIdx={pIdx}
                      dayIdx={todayDayIdx}
                      date={today}
                    />
                  ))}
                </div>

                {TIMETABLE[todayDayIdx].every(s => s === "—") && (
                  <p style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#8fa3c0", textAlign: "center", padding: "40px 0" }}>
                    No classes scheduled for today.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: WEEK ──────────────────────────────────────────────────────── */}
        {activeTab === "week" && (
          <div>
            {/* Day selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {DAYS.map((day, dIdx) => {
                const isToday = dIdx === todayDayIdx;
                const isSel = dIdx === selectedDay;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dIdx)}
                    style={{
                      backgroundColor: isSel ? "rgba(200,57,10,0.12)" : "transparent",
                      color: isSel ? "#c8390a" : isToday ? "#e8edf8" : "#8fa3c0",
                      border: isSel
                        ? "1px solid rgba(200,57,10,0.30)"
                        : isToday
                          ? "1px solid rgba(255,255,255,0.25)"
                          : "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontFamily: "DM Sans",
                      fontWeight: isToday ? 600 : 400,
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {day.slice(0, 3)} {isToday && "·Today"}
                  </button>
                );
              })}
            </div>

            {/* Note: for past/future days we use today's date as placeholder  */}
            {/* In a real app you'd pick the actual date of that weekday       */}
            <div className="flex items-center mb-4">
              <div style={{ width: "3px", height: "18px", backgroundColor: "#c8390a", marginRight: "10px" }} />
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "18px", color: "#e8edf8" }}>
                {DAYS[selectedDay]}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TIMETABLE[selectedDay].map((subject, pIdx) => (
                <DayClassRow
                  key={pIdx}
                  subject={subject}
                  periodIdx={pIdx}
                  dayIdx={selectedDay}
                  date={today}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: STATS ─────────────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBJECTS.map((subject) => {
                const { held, present, absent, pct } = subjectStats(subject);
                const need = classesNeeded(subject);
                const color = pctColor(pct);
                const bg = pctBg(pct);
                const border = pctBorder(pct);

                return (
                  <div
                    key={subject}
                    style={{
                      backgroundColor: bg,
                      border: `1px solid ${border}`,
                      borderRadius: "12px",
                      padding: "20px"
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "18px", color: "#e8edf8", marginBottom: "2px" }}>
                          {subject}
                        </p>
                        <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#4d6380" }}>
                          {held} classes tracked
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "28px", color }}>
                          {pct !== null ? `${pct}%` : "—"}
                        </p>
                        {pct !== null && pct < 75 && (
                          <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#f87171" }}>
                            ↑ attend {need} more
                          </p>
                        )}
                        {pct !== null && pct >= 75 && pct < 85 && (
                          <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#fbbf24" }}>
                            ⚠ borderline
                          </p>
                        )}
                        {pct !== null && pct >= 85 && (
                          <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4ade80" }}>
                            ✓ safe
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: "6px", backgroundColor: "#112038", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                      <div
                        style={{
                          height: "100%",
                          width: pct !== null ? `${pct}%` : "0%",
                          backgroundColor: color,
                          borderRadius: "4px",
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>

                    {/* Mini stats */}
                    <div className="flex gap-4">
                      <div>
                        <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4d6380" }}>Present</p>
                        <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#4ade80" }}>{present}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4d6380" }}>Absent</p>
                        <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#f87171" }}>{absent}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4d6380" }}>75% target</p>
                        <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#e8edf8" }}>
                          {held > 0 ? `${Math.ceil(held * 0.75)}` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      <MobileTabBar />
    </div>
  );
}
