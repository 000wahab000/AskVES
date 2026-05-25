import { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, MinusCircle, AlertTriangle, BookOpen, TrendingUp, Calendar, RotateCcw } from "lucide-react";
import { TopNavbar } from "../components/TopNavbar";
import { MobileTabBar } from "../components/MobileTabBar";
import timetableData from "../data/timetable.json";

// --- Types -------------------------------------------------------------------
type Status = "present" | "absent" | "cancelled";

const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// --- Parse a slot string -> subject label ------------------------------------
// e.g. "EP-B1(MT)/BEE-B2(MJ)" -> "EP / BEE"
// e.g. "FEM-II-TUT(RS/AD)"   -> "FEM-II-TUT"
function parseSubjectCode(slot: string): string {
  if (!slot) return "\u2014";
  const parts = slot.split("/").map(p => {
    const idx = p.indexOf("(");
    const raw = idx > -1 ? p.slice(0, idx) : p;
    return raw.replace(/-B(atch)?[12]$/i, "").trim();
  });
  const unique = [...new Set(parts.filter(Boolean))];
  return unique.length ? unique.join(" / ") : "\u2014";
}

// --- Build schedule for a given class code -----------------------------------
function buildClassTimetable(classCode: string) {
  const tt   = (timetableData as any).timetable as Record<string, Record<string, Record<string, { room: string; slots: Record<string, string> }>>>;
  const slotDefs = (timetableData as any).time_slots as { slot: number; start: string; end: string }[];

  const periodTimes = slotDefs.map(s => `${s.start}\u2013${s.end}`);
  const numSlots    = slotDefs.length; // 6

  // timetable[dayIdx][slotIdx] = subject string | "\u2014"
  const timetable: string[][] = DAYS_ORDER.map(() => Array(numSlots).fill("\u2014"));

  DAYS_ORDER.forEach((day, dayIdx) => {
    const dayData = tt[day];
    if (!dayData) return;
    for (const group of Object.values(dayData)) {
      if (group[classCode]) {
        const divSlots = group[classCode].slots;
        Object.entries(divSlots).forEach(([num, raw]) => {
          const sIdx = parseInt(num) - 1;
          if (sIdx >= 0 && sIdx < numSlots && raw) {
            timetable[dayIdx][sIdx] = parseSubjectCode(raw);
          }
        });
        break;
      }
    }
  });

  // Collect unique subjects (split compound "A / B" into individual entries)
  const subjectSet = new Set<string>();
  timetable.forEach(day =>
    day.forEach(cell => {
      if (cell !== "\u2014") cell.split(" / ").forEach(s => subjectSet.add(s.trim()));
    })
  );

  return { timetable, periodTimes, subjects: [...subjectSet].sort() };
}

// --- Attendance key ----------------------------------------------------------
function makeKey(date: string, dayIdx: number, slotIdx: number) {
  return `att_${date}_${dayIdx}_${slotIdx}`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getTodayDayIdx() {
  const d = new Date().getDay(); // 0 = Sun
  if (d === 0 || d === 6) return -1; // weekend
  return d - 1; // Mon=0...Fri=4
}

// --- Component ---------------------------------------------------------------
export function AttendanceTracker() {
  // -- user from login --------------------------------------------------------
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("askves_user") ?? "null"); }
    catch { return null; }
  }, []);

  const classCode: string = user?.classCode ?? "";
  const { timetable: TIMETABLE, periodTimes: PERIOD_TIMES, subjects: SUBJECTS } =
    useMemo(() => buildClassTimetable(classCode), [classCode]);

  // -- attendance state -------------------------------------------------------
  const [attendance, setAttendance] = useState<Record<string, Status>>(() => {
    try { return JSON.parse(localStorage.getItem("askves_attendance") ?? "{}"); }
    catch { return {}; }
  });

  const [activeTab, setActiveTab]     = useState<"today" | "week" | "stats">("today");
  const [selectedDay, setSelectedDay] = useState(() => {
    const t = getTodayDayIdx(); return t >= 0 ? t : 0;
  });

  const today       = todayStr();
  const todayDayIdx = getTodayDayIdx();

  useEffect(() => {
    localStorage.setItem("askves_attendance", JSON.stringify(attendance));
  }, [attendance]);

  // -- mark -------------------------------------------------------------------
  function mark(date: string, dayIdx: number, slotIdx: number, status: Status) {
    const key = makeKey(date, dayIdx, slotIdx);
    setAttendance(prev => {
      const next = { ...prev };
      if (next[key] === status) delete next[key]; else next[key] = status;
      return next;
    });
  }

  function getStatus(date: string, dayIdx: number, slotIdx: number): Status | null {
    return attendance[makeKey(date, dayIdx, slotIdx)] ?? null;
  }

  // -- subject stats ----------------------------------------------------------
  function subjectStats(subject: string) {
    let held = 0, present = 0;
    Object.entries(attendance).forEach(([key, status]) => {
      const parts = key.split("_");
      if (parts.length < 4) return;
      const dIdx = parseInt(parts[2]);
      const sIdx = parseInt(parts[3]);
      const cell = TIMETABLE[dIdx]?.[sIdx] ?? "\u2014";
      // cell may be "EP / BEE" - check if subject appears
      if (cell !== "\u2014" && cell.split(" / ").map(s => s.trim()).includes(subject)) {
        if (status !== "cancelled") { held++; if (status === "present") present++; }
      }
    });
    const pct = held > 0 ? Math.round((present / held) * 100) : null;
    return { held, present, absent: held - present, pct };
  }

  function classesNeeded(subject: string) {
    const { held, present } = subjectStats(subject);
    const x = Math.ceil((0.75 * held - present) / 0.25);
    return x > 0 ? x : 0;
  }

  function resetAll() {
    if (window.confirm("Reset all attendance data? This cannot be undone.")) {
      setAttendance({});
      localStorage.removeItem("askves_attendance");
    }
  }

  // -- colour helpers ---------------------------------------------------------
  function pctColor(pct: number | null) {
    if (pct === null) return "#3d5a7a";
    if (pct >= 85)   return "#4ade80";
    if (pct >= 75)   return "#fbbf24";
    return "#f87171";
  }
  function pctBg(pct: number | null) {
    if (pct === null) return "rgba(255,255,255,0.04)";
    if (pct >= 85)   return "rgba(74,222,128,0.08)";
    if (pct >= 75)   return "rgba(251,191,36,0.08)";
    return "rgba(248,113,113,0.08)";
  }
  function pctBorder(pct: number | null) {
    if (pct === null) return "rgba(100,160,220,0.10)";
    if (pct >= 85)   return "rgba(74,222,128,0.20)";
    if (pct >= 75)   return "rgba(251,191,36,0.20)";
    return "rgba(248,113,113,0.20)";
  }

  // -- overall stats ----------------------------------------------------------
  const allStats    = SUBJECTS.map(s => ({ subject: s, ...subjectStats(s) }));
  const totalHeld   = allStats.reduce((a, s) => a + s.held, 0);
  const totalPresent= allStats.reduce((a, s) => a + s.present, 0);
  const overallPct  = totalHeld > 0 ? Math.round((totalPresent / totalHeld) * 100) : null;

  // -- no class found guard ---------------------------------------------------
  const classNotFound = classCode && SUBJECTS.length === 0;

  // -- StatusBtn --------------------------------------------------------------
  const StatusBtn = ({ label, icon: Icon, color, active, onClick }: {
    label: string; icon: any; color: string; active: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "6px 12px", borderRadius: "6px", cursor: "pointer",
        border: active ? `1px solid ${color}` : "1px solid rgba(100,160,220,0.15)",
        backgroundColor: active ? `${color}22` : "transparent",
        color: active ? color : "#3d5a7a",
        fontFamily: "DM Sans", fontSize: "12px", fontWeight: 500, transition: "all 0.15s",
      }}
    >
      <Icon className="w-3 h-3" />{label}
    </button>
  );

  // -- DayClassRow ------------------------------------------------------------
  const DayClassRow = ({ subject, slotIdx, dayIdx, date }: {
    subject: string; slotIdx: number; dayIdx: number; date: string;
  }) => {
    if (subject === "\u2014") return null;
    const status = getStatus(date, dayIdx, slotIdx);
    return (
      <div className="attendance-class-row" style={{
        backgroundColor: "#0b1730", border: "1px solid rgba(100,160,220,0.10)",
        borderRadius: "10px", padding: "14px 16px",
      }}>
        <div style={{ minWidth: "110px" }}>
          <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#3d5a7a", marginBottom: "2px" }}>
            Slot {slotIdx + 1}
          </p>
          <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a9bbf" }}>
            {PERIOD_TIMES[slotIdx]}
          </p>
        </div>

        <span style={{
          backgroundColor: "rgba(26,127,168,0.12)", color: "#1a7fa8",
          border: "1px solid rgba(26,127,168,0.25)", borderRadius: "6px",
          padding: "4px 12px", fontFamily: "Space Grotesk", fontSize: "13px",
          fontWeight: 600, flex: 1,
        }}>
          {subject}
        </span>

        <div className="attendance-status-buttons">
          <StatusBtn label="Present"   icon={CheckCircle} color="#4ade80"  active={status === "present"}   onClick={() => mark(date, dayIdx, slotIdx, "present")} />
          <StatusBtn label="Absent"    icon={XCircle}     color="#f87171"  active={status === "absent"}    onClick={() => mark(date, dayIdx, slotIdx, "absent")} />
          <StatusBtn label="Cancelled" icon={MinusCircle} color="#fbbf24"  active={status === "cancelled"} onClick={() => mark(date, dayIdx, slotIdx, "cancelled")} />
        </div>
      </div>
    );
  };

  // --- RENDER ----------------------------------------------------------------
  return (
    <div className="page-wrapper">
      <TopNavbar />

      <main className="page-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance Tracker</h1>
            <p className="page-subtitle">
              {classCode
                ? `Class ${classCode} \u00b7 ${user?.department ?? ""} ${user?.year ?? ""} \u00b7 synced from timetable`
                : "Login to see your personalised timetable"}
            </p>
          </div>
          <button
            onClick={resetAll}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              backgroundColor: "transparent", border: "1px solid rgba(248,113,113,0.30)",
              color: "#f87171", borderRadius: "8px", padding: "8px 16px",
              fontFamily: "DM Sans", fontSize: "13px", cursor: "pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.08)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
        </div>

        {/* No class guard */}
        {classNotFound && (
          <div className="warning-banner" style={{ marginBottom: "32px" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#f87171", flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: "14px", color: "#f87171", marginBottom: "4px" }}>
                Class &quot;{classCode}&quot; not found in timetable
              </p>
              <p style={{ fontFamily: "DM Sans", fontSize: "13px", color: "#7a9bbf" }}>
                Your class code may not be in the database yet. Contact admin or re-login with a valid class.
              </p>
            </div>
          </div>
        )}

        {/* Subjects chip list */}
        {SUBJECTS.length > 0 && (
          <div className="filter-pill-row" style={{ marginBottom: "28px" }}>
            {SUBJECTS.map(s => (
              <span key={s} style={{
                backgroundColor: "rgba(26,127,168,0.10)", color: "#1a7fa8",
                border: "1px solid rgba(26,127,168,0.20)", borderRadius: "999px",
                padding: "4px 12px", fontFamily: "Space Grotesk", fontSize: "12px", fontWeight: 500,
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Overall stat cards */}
        <div className="stat-cards-row">
          {[
            { label: "Overall",       value: overallPct !== null ? `${overallPct}%` : "\u2014", sub: "attendance",    color: pctColor(overallPct) },
            { label: "Classes Held",  value: String(totalHeld),                                 sub: "total tracked", color: "#dce8f5"            },
            { label: "Present",       value: String(totalPresent),                              sub: "marked present", color: "#4ade80"            },
            { label: "Absent",        value: String(totalHeld - totalPresent),                  sub: "missed",         color: "#f87171"            },
          ].map(card => (
            <div key={card.label} style={{
              backgroundColor: "#0b1730", border: "1px solid rgba(100,160,220,0.10)",
              borderRadius: "12px", padding: "20px", textAlign: "center",
            }}>
              <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "28px", color: card.color, marginBottom: "4px" }}>{card.value}</p>
              <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#3d5a7a", marginBottom: "2px" }}>{card.label}</p>
              <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#2d4060" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Low attendance warning */}
        {allStats.some(s => s.pct !== null && s.pct < 75) && (
          <div className="warning-banner">
            <AlertTriangle className="w-5 h-5" style={{ color: "#f87171", marginTop: "2px", flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: "14px", color: "#f87171", marginBottom: "4px" }}>
                Low Attendance Warning
              </p>
              <p style={{ fontFamily: "DM Sans", fontSize: "13px", color: "#7a9bbf" }}>
                {allStats.filter(s => s.pct !== null && s.pct < 75).map(s =>
                  `${s.subject}: ${s.pct}% (attend ${classesNeeded(s.subject)} more)`
                ).join(" \u00b7 ")}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tab-strip">
          {(["today", "week", "stats"] as const).map(tab => {
            const active = activeTab === tab;
            const labels = { today: "Today's Classes", week: "Weekly View", stats: "Subject Stats" };
            const icons:  Record<string, any> = { today: Calendar, week: TrendingUp, stats: BookOpen };
            const Icon = icons[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                backgroundColor: active ? "rgba(26,127,168,0.15)" : "transparent",
                color: active ? "#1a7fa8" : "#7a9bbf",
                border: active ? "1px solid rgba(26,127,168,0.35)" : "1px solid rgba(100,160,220,0.15)",
                borderRadius: "8px", padding: "10px 18px",
                fontFamily: "DM Sans", fontWeight: 500, fontSize: "14px", cursor: "pointer",
              }}>
                <Icon className="w-4 h-4" />{labels[tab]}
              </button>
            );
          })}
        </div>

        {/* -- TAB: TODAY -- */}
        {activeTab === "today" && (
          <div>
            {todayDayIdx < 0 ? (
              <div className="empty-state">\uD83C\uDF89 It&apos;s the weekend \u2014 no classes today!</div>
            ) : (
              <div>
                <div className="section-heading-row">
                  <div className="section-heading-bar" />
                  <h2 className="section-heading-text">{DAY_LABELS[todayDayIdx]} \u00b7 {today}</h2>
                </div>
                <div className="card-list">
                  {TIMETABLE[todayDayIdx].map((subject, sIdx) => (
                    <DayClassRow key={sIdx} subject={subject} slotIdx={sIdx} dayIdx={todayDayIdx} date={today} />
                  ))}
                </div>
                {TIMETABLE[todayDayIdx].every(s => s === "\u2014") && (
                  <div className="empty-state">No classes scheduled for today.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -- TAB: WEEK -- */}
        {activeTab === "week" && (
          <div>
            <div className="filter-pill-row">
              {DAY_LABELS.map((day, dIdx) => {
                const isToday = dIdx === todayDayIdx;
                const isSel   = dIdx === selectedDay;
                return (
                  <button key={day} onClick={() => setSelectedDay(dIdx)} style={{
                    backgroundColor: isSel ? "rgba(26,127,168,0.15)" : "transparent",
                    color: isSel ? "#1a7fa8" : isToday ? "#dce8f5" : "#7a9bbf",
                    border: isSel ? "1px solid rgba(26,127,168,0.35)"
                          : isToday ? "1px solid rgba(100,160,220,0.30)"
                          : "1px solid rgba(100,160,220,0.15)",
                    borderRadius: "8px", padding: "8px 16px",
                    fontFamily: "DM Sans", fontWeight: isToday ? 600 : 400,
                    fontSize: "14px", cursor: "pointer",
                  }}>
                    {day.slice(0, 3)}{isToday && " \u00b7 Today"}
                  </button>
                );
              })}
            </div>

            <div className="section-heading-row">
              <div className="section-heading-bar" />
              <h2 className="section-heading-text">{DAY_LABELS[selectedDay]}</h2>
            </div>

            <div className="card-list">
              {TIMETABLE[selectedDay].map((subject, sIdx) => (
                <DayClassRow key={sIdx} subject={subject} slotIdx={sIdx} dayIdx={selectedDay} date={today} />
              ))}
            </div>
          </div>
        )}

        {/* -- TAB: STATS -- */}
        {activeTab === "stats" && (
          <div className="two-col-grid">
            {SUBJECTS.map(subject => {
              const { held, present, absent, pct } = subjectStats(subject);
              const need   = classesNeeded(subject);
              const color  = pctColor(pct);
              return (
                <div key={subject} style={{
                  backgroundColor: pctBg(pct), border: `1px solid ${pctBorder(pct)}`,
                  borderRadius: "12px", padding: "20px",
                }}>
                  <div className="page-header" style={{ marginBottom: "16px" }}>
                    <div>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "18px", color: "#dce8f5", marginBottom: "2px" }}>{subject}</p>
                      <p style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#3d5a7a" }}>{held} classes tracked</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "28px", color }}>{pct !== null ? `${pct}%` : "\u2014"}</p>
                      {pct !== null && pct < 75  && <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#f87171" }}>&rarr; attend {need} more</p>}
                      {pct !== null && pct >= 75 && pct < 85 && <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#fbbf24" }}>&#9888; borderline</p>}
                      {pct !== null && pct >= 85 && <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#4ade80" }}>&#10003; safe</p>}
                    </div>
                  </div>

                  <div style={{ height: "6px", backgroundColor: "#0b1e38", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", width: pct !== null ? `${pct}%` : "0%", backgroundColor: color, borderRadius: "4px", transition: "width 0.4s ease" }} />
                  </div>

                  <div className="mini-stats-row">
                    <div>
                      <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#3d5a7a" }}>Present</p>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#4ade80" }}>{present}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#3d5a7a" }}>Absent</p>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#f87171" }}>{absent}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#3d5a7a" }}>75% target</p>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "16px", color: "#dce8f5" }}>{held > 0 ? Math.ceil(held * 0.75) : "\u2014"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {SUBJECTS.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                {classCode ? `No subjects found for class "${classCode}".` : "Please log in to see your subjects."}
              </div>
            )}
          </div>
        )}

      </main>

      <MobileTabBar />
    </div>
  );
}
